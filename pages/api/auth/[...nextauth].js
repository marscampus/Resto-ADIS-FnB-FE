import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { serialize } from 'cookie';
import { encrypt, listingMenu } from '../../../utilities/encrypt';
import axios from 'axios';

export const getNextAuthOptions = (req, res) => {
    const authOptions = {
        providers: [
            CredentialsProvider({
                // Credentials provider configuration
                name: 'credentials',

                async authorize(credentials) {
                    try {
                        // Melakukan request ke API login
                        const result = await axios({
                            method: 'post',
                            url: `${process.env.API_URL}/api/login`,
                            headers: { 'Content-Type': 'application/json' },
                            data: JSON.stringify({
                                email: credentials?.email,
                                password: credentials?.password,
                                aslogin: credentials?.aslogin
                            })
                        });

                        // Mendapatkan data pengguna dari respons
                        const user = result.data;

                        // Jika user memiliki properti `name`, proses berhasil
                        if (user?.name) {
                            // Mengenkripsi token
                            const encToken = encrypt(user.token);
                            const token_encrypt = `${encToken.encryptedText}/${encToken.iv}`;

                            // Membuat cookie untuk token
                            const cookies = serialize('_A2F', token_encrypt, {
                                httpOnly: true,
                                // secure: process.env.NODE_ENV === 'production', // Secure hanya untuk produksi
                                secure: false,
                                sameSite: 'lax',
                                path: '/',
                                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Kedaluwarsa dalam 7 hari
                            });

                            // Menetapkan header cookie pada respons
                            res.setHeader('Set-Cookie', cookies);

                            // Menyimpan menu ke dalam properti user (jika ada)
                            user.menu = user?.menu;

                            return user; // Mengembalikan data pengguna
                        }

                        // Jika tidak ada `name`, lempar error dengan pesan dari user.error
                        throw new Error(user.error || 'Unknown error');
                    } catch (error) {
                        // Menangkap dan melempar ulang pesan error dari respons API
                        const errorMessage = error.response?.data?.message || error.message || 'Login failed';
                        throw new Error(errorMessage);
                    }
                }
            })
        ],
        pages: {
            signIn: '/login',
            error: '/login', // Error code passed in query string as ?error=
            signOut: '/login'
        },
        cookies: {
            sessionToken: {
                name: `_A2R`,
                options: {
                    httpOnly: true,
                    sameSite: 'lax',
                    path: '/',
                    secure: false
                }
            }
        },
        callbacks: {
            //parameter user berasal dari const user di atas
            async jwt({ token, account, user }) {
                // Persist the OAuth access_token and or the user id to the token right after signin
                // if (account) {
                //   token.token = user.token
                // }
                if (user) {
                    token.userRole = user.role;
                    token.menu = user.menu;
                    token.sektor = user.sektor;
                }
                return token;
            },
            async session({ session, token, user }) {
                // Send properties to the client, like an access_token and user id from a provider.
                // session.user.token = token.token
                // session.user.role = token.role
                session.user.userRole = token.userRole;
                session.user.menu = token.menu;

                return session;
            }
        }
    };

    return authOptions;
};

export default async function handler(req, res) {
    return await NextAuth(req, res, getNextAuthOptions(req, res));
}

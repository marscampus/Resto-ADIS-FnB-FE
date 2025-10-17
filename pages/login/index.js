import React, { useContext, useEffect, useRef, useState } from 'react';
import { getServerSession } from 'next-auth/next';
import { getNextAuthOptions } from '../api/auth/[...nextauth]';
import { InputText } from 'primereact/inputtext';
import { LayoutContext } from '../../layout/context/layoutcontext';
import { signIn, getSession } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';

export async function getServerSideProps(context) {
    const sessionData = await getServerSession(context.req, context.res, getNextAuthOptions(context.req, context.res));
    if (sessionData?.user) {
        return {
            redirect: {
                permanent: false,
                destination: '/'
            }
        };
    }

    return {
        props: {}
    };
}

function LoginPage() {
    const router = useRouter();
    const { error } = router.query;
    const { onMenuToggle } = useContext(LayoutContext);
    let emptyData = {
        email: '',
        password: ''
    };
    const [dataLogin, setDataLogin] = useState(emptyData);
    const [err, setErr] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [selectedLogin, setSelectedLogin] = useState({
        name: 'owner',
        code: 'user'
    });
    const [loading, setLoading] = useState(false);

    const onInputChange = (val, key) => {
        let _dataLogin = { ...dataLogin };
        _dataLogin[key] = val;
        setDataLogin(_dataLogin);
        formik.setValues(_dataLogin);
    };

    const onHandleSubmit = async () => {
        setSubmitted(true);
        setLoading(true);
        try {
            if (dataLogin.email && dataLogin.password) {
                const login = await signIn('credentials', {
                    email: dataLogin.email,
                    password: dataLogin.password,
                    aslogin: selectedLogin.code,
                    redirect: false
                });
                if (login?.error) {
                    if (login?.error.includes('reason:')) {
                        return setErr('Error Network');
                    }
                    setLoading(false);
                    setErr(login.error);
                } else {
                    const updatedSession = await getSession();

                    if (updatedSession?.user?.userRole === 'kasir') {
                        router.push('/kasir');
                        onMenuToggle();
                    } else {
                        router.push('/');
                    }
                }
            }
        } catch (error) {
            setLoading(false);
        }
    };

    const validationSchema = Yup.object().shape({
        email: Yup.string().email('Invalid email').required('harus diisi'),
        password: Yup.string().required('harus diisi')
    });

    const formik = useFormik({
        initialValues: dataLogin,
        validationSchema: validationSchema,
        onSubmit: onHandleSubmit
    });

    return (
        <div
            className="h-screen flex align-items-center justify-content-center bg-primary"
        // style={{
        //     // backgroundColor: 'white',
        //     // height: '100%',
        //     // display: 'flex',
        //     // flexDirection: 'column',
        //     backgroundColor: 'rgb(120, 157, 135)'
        // }}
        >
            <div className="w-11 md:w-10 mx-4" style={{ minWidth: '300px' }}>
                <div className="grid shadow-5 border-round" style={{ backgroundColor: 'var(--surface-card)' }}>
                    {/* Form Column */}
                    <div className="col-12 lg:col-5 p-6 flex flex-column justify-content-between">
                        <div>
                            <div className="text-center mb-6">
                                <img src="layout/images/fnb-removebg.png" alt="logo" className="mb-4" style={{ height: '50px' }} />
                                <div className="text-900 text-3xl font-medium mb-3">ADIS FnB System</div>
                            </div>

                            <div style={{}}>
                                {!!err && (
                                    <div className="text-center" style={{ color: 'red' }}>
                                        {err}
                                    </div>
                                )}
                            </div>

                            <form onSubmit={formik.handleSubmit} className="p-fluid">
                                <div className="field mb-4">
                                    <label htmlFor="email" className="block text-900 font-medium mb-2">
                                        Email
                                    </label>
                                    <InputText
                                        id="email"
                                        type="text"
                                        value={formik.values.email}
                                        onChange={(e) => onInputChange(e.target.value, 'email')}
                                        className={classNames({ 'p-invalid': formik.errors.email })}
                                        placeholder="Email address"
                                        style={{ padding: '1rem' }}
                                    />
                                    {formik.errors.email && <small className="p-error block">{formik.errors.email}</small>}
                                </div>

                                <div className="field mb-5">
                                    <label htmlFor="password" className="block text-900 font-medium mb-2">
                                        Password
                                    </label>
                                    <Password
                                        id="password"
                                        value={formik.values.password}
                                        onChange={(e) => onInputChange(e.target.value, 'password')}
                                        toggleMask
                                        feedback={false}
                                        className={classNames({ 'p-invalid': formik.errors.password })}
                                        inputClassName="w-full"
                                        placeholder="Password"
                                    // inputStyle={{ padding: '1rem' }}
                                    />
                                    {formik.errors.password && <small className="p-error block">{formik.errors.password}</small>}
                                </div>

                                <button
                                    style={{
                                        border: 'none',
                                        borderRadius: '2px',
                                        paddingTop: '9px',
                                        paddingBottom: '9px',
                                        cursor: 'pointer'
                                    }}
                                    className={'flex align-items-center justify-content-between gap-2 px-4 rounded bg-primary text-white font-medium shadow-md hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition w-full'}
                                    disabled={loading}
                                    type="submit"
                                >
                                    <>
                                        <i className={`${loading ? 'pi pi-spin pi-spinner' : 'pi pi-user'}`}></i>
                                        <div className="w-full">
                                            <div>Sign In</div>
                                        </div>
                                    </>
                                </button>
                                {/* <Button label="Sign In" icon="pi pi-user" className="w-full" loading={loading} disabled={loading} /> */}
                            </form>
                        </div>

                        <div className="text-center mt-6">
                            <span className="text-600 font-medium line-height-3">© Mars {new Date().getFullYear()}</span>
                        </div>
                    </div>

                    {/* Image Column */}
                    <div className="col-12 lg:col-7 hidden lg:flex p-0">
                        <img
                            src={`/layout/images/fnb.jpg`}
                            alt="Kebugaran"
                            className="w-full border-round-right"
                            style={{
                                objectFit: 'cover',
                                height: '100%',
                                borderTopRightRadius: 'var(--border-radius)',
                                borderBottomRightRadius: 'var(--border-radius)'
                            }}
                        />
                    </div>
                </div>

                {error && <div className="mt-4 p-4 border-round bg-red-100 text-red-700">Error: {error}</div>}
            </div>
        </div>
    );
}

LoginPage.getLayout = function LoginPage(page) {
    return <>{page}</>;
};

export default LoginPage;

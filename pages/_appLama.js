import React from 'react';
import { LayoutProvider } from '../layout/context/layoutcontext';
import Layout from '../layout/layout';
import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import '../styles/layout/layout.scss';
import '../styles/demo/Demos.scss';

import store from '../store';
import { Provider } from 'react-redux';
import { SessionProvider } from "next-auth/react";

export default function MyApp({ Component,  pageProps: { session, ...pageProps } }) {
    if (Component.getLayout) {
        return (
            <SessionProvider session={session}>
            <Provider store={store}>
                <LayoutProvider>
                    {Component.getLayout(<Component {...pageProps} />)}
                </LayoutProvider>
            </Provider>
            </SessionProvider>
        )
    } else {
        return (
            <SessionProvider session={session}>
                <LayoutProvider>
                    <Layout>
                        <Component {...pageProps} />
                    </Layout>
                </LayoutProvider>
            </SessionProvider>
        );
    }
}

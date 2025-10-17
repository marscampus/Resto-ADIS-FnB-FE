import React, { forwardRef, useEffect, useState } from 'react';
import { getDBConfig } from '../../component/GeneralFunction/GeneralFunction';

const ReceiptKitchen = forwardRef((props, ref) => {
    const { dataStrukDapur } = props;
    const [configData, setConfigData] = useState({
        namaPerusahaan: '',
        alamatPerusahaan: '',
        infoKasir: '',
        telp: ''
    });
    const rightAlign = {
        textAlign: 'right',
        paddingLeft: '10px'
    };
    const GridRow = ({ label, value, bold = false }) => (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'auto auto 1fr',
                gap: '2px',
                alignItems: 'center',
                marginBottom: '2px'
            }}
        >
            <span>{label}</span>
            <span></span>
            <span style={{ ...rightAlign, ...(bold ? { fontWeight: 'bold' } : {}) }}>{value}</span>
        </div>
    );

    useEffect(() => {
        const fetchConfig = async () => {
            const namaPerusahaan = await getDBConfig('namaPerusahaan');
            const alamatPerusahaan = await getDBConfig('alamatPerusahaan');
            const infoKasir = await getDBConfig('infoKasir');
            const teleponPerusahaan = await getDBConfig('teleponPerusahaan');
            setConfigData((prev) => ({
                ...prev,
                namaPerusahaan: namaPerusahaan,
                alamatPerusahaan: alamatPerusahaan,
                infoKasir: infoKasir,
                telp: teleponPerusahaan
            }))
        };

        fetchConfig();
    }, []);

    return (
        <div
            ref={ref}
            style={{
                padding: '5px 20px', // Menambahkan padding lebih banyak pada kiri dan kanan
                fontFamily: 'Helvetica, monospace',
                fontSize: '10px',
                lineHeight: '1.3',
                margin: '0 auto', // Agar kontainer terpusat di tengah
                maxWidth: '250px' // Batas lebar agar tidak terlalu lebar
            }}
        >
            {/* HEADER */}
            <h3 style={{ textAlign: 'center', margin: '5px' }}>{configData?.namaPerusahaan}</h3>
            <p style={{ textAlign: 'center', margin: '2px ' }}>
                {configData?.alamatPerusahaan}, {configData?.telp}
            </p>
            <p style={{ textAlign: 'center', margin: '2px ' }}>Antrian : {dataStrukDapur?.ANTRIAN}</p>
            <p style={{ textAlign: 'center', margin: '2px ' }}>Cetak Untuk Dapur</p>

            <hr style={{ margin: '5px 0' }} />
            {/* INFORMASI TRANSAKSI */}

            <GridRow label="Kasir" value={dataStrukDapur?.KASIR} />
            <GridRow label="Tanggal" value={dataStrukDapur?.TGL} />
            <GridRow label="Pelanggan/Member" value={dataStrukDapur?.PELANGGAN || dataStrukDapur?.NAMAMEMBER} />
            <GridRow label="Meja" value={dataStrukDapur?.MEJA} />

            <hr style={{ margin: '5px' }} />

            {/* DETAIL BARANG */}
            {dataStrukDapur?.detail_penjualan?.map((item, index) => (
                <div
                    key={index}
                    style={{
                        marginBottom: '5px',
                        borderBottom: '1px dotted #ddd',
                        paddingBottom: '3px'
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: '2px'
                        }}
                    >
                        <div style={{ flex: 1, textAlign: 'left', marginLeft: '5px' }}>
                            {item.QTY} x {item.NAMA}
                        </div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                        <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                            {item.NOTES?.split(';').map(
                                (note, index) =>
                                    note.trim() && ( // Pastikan item tidak kosong setelah di-trim
                                        <li key={index}>{note.trim()}</li>
                                    )
                            )}
                        </ul>
                    </div>
                </div>
            ))}
            <hr style={{ margin: '5px 0' }} />

            {/* FOOTER PESAN */}
            <p style={{ textAlign: 'center', marginTop: '10px' }}>Mohon untuk dicek kembali sebelum disajikan kepada customer!^^</p>
        </div>
    );
});

export default ReceiptKitchen;

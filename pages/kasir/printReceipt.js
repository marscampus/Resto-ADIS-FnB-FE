import React, { forwardRef, useEffect, useState } from 'react';
import { getDBConfig } from '../../component/GeneralFunction/GeneralFunction';

const PrintReceipt = forwardRef((props, ref) => {
    const { dataStruk } = props;
    const [configData, setConfigData] = useState({
        namaPerusahaan: '',
        alamatPerusahaan: '',
        infoKasir: '',
        telp: ''
    });

    // Style untuk nilai yang right-aligned
    const rightAlign = {
        textAlign: 'right',
        paddingLeft: '10px'
    };

    useEffect(() => {
        const fetchConfig = async () => {
            const logoPerusahaan = await getDBConfig('logoPerusahaan');
            const namaPerusahaan = await getDBConfig('namaPerusahaan');
            const alamatPerusahaan = await getDBConfig('alamatPerusahaan');
            const infoKasir = await getDBConfig('infoKasir');
            const teleponPerusahaan = await getDBConfig('teleponPerusahaan');
            const now = new Date();
            const pad = (n) => n.toString().padStart(2, '0');
            const formatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
            setConfigData((prev) => ({
                ...prev,
                logoPerusahaan: logoPerusahaan,
                namaPerusahaan: namaPerusahaan,
                alamatPerusahaan: alamatPerusahaan,
                infoKasir: infoKasir,
                telp: teleponPerusahaan,
                tgl: formatted
            }))
        };

        fetchConfig();
    }, []);

    // Komponen helper untuk membuat baris grid dengan 3 kolom: label, titik dua, dan value
    const GridRow = ({ label, value, bold = false }) => (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'auto auto 1fr',
                gap: '2px',
                alignItems: 'center',
                marginBottom: '1px'
            }}
        >
            <span>{label}</span>
            <span></span>
            <span style={{ ...rightAlign, ...(bold ? { fontWeight: 'bold' } : {}) }}>{value}</span>
        </div>
    );

    return (
        <div
            ref={ref}
            style={{
                padding: '5px 20px', // ← kanan kiri lebih lebar
                fontFamily: "'Courier New', monospace",
                fontSize: '11px',
                lineHeight: '1.1',
                maxWidth: '230px',   // ← sedikit dikecilin biar aman dari tepi kertas
                margin: '0 auto',
                boxSizing: 'border-box'
            }}
        >
            {/* HEADER */}
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <img src={configData?.logoPerusahaan} alt="Logo" style={{ width: '50px', margin: '5px auto' }} />
                <h3 style={{ margin: '2px 0', fontSize: '13px' }}>{configData?.namaPerusahaan}</h3>
                <p style={{ margin: '2px 0' }}>
                    {configData?.alamatPerusahaan}
                    <br />
                    Pesanan {dataStruk?.PEMESANAN}
                    <br />
                    No.Trx {dataStruk?.FAKTUR}
                </p>
            </div>
            <hr style={{ borderTop: '1px dashed black', margin: '4px 0' }} />

            {/* INFO TRANSAKSI */}
            <div>
                {/* Baris pertama: Tanggal kiri atas, Kasir kanan atas */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <div>
                        <div>{configData?.tgl}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div>Kasir</div>
                        <div>{dataStruk?.KASIR}</div>
                    </div>
                </div>

                {/* Garis pembatas */}
                <hr style={{ borderTop: '1px dashed black', margin: '4px 0' }} />

                {/* Baris kedua: Item di kiri, Antrian di kanan */}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>Item : {dataStruk?.detail_penjualan?.length || 0}</div>
                    <div>No {dataStruk?.Antrian}</div>
                </div>

                {/* Baris ketiga: Member / Pelanggan (jika ada) dan Meja (jika ada) */}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        {dataStruk?.NAMAMEMBER
                            ? <div>{dataStruk?.NAMAMEMBER}</div>
                            : dataStruk?.PELANGGAN
                                ? <div>{dataStruk.PELANGGAN}</div>
                                : null}
                    </div>
                    <div>{dataStruk?.MEJA && <div>{dataStruk.MEJA}</div>}</div>
                </div>
            </div>

            <hr style={{ borderTop: '1px dashed black', margin: '4px 0' }} />

            {/* DETAIL ITEM */}
            <div style={{ margin: '6px 0' }}>
                {dataStruk?.detail_penjualan?.map((item, i) => (
                    <div key={i} style={{ margin: '2px 0' }}>
                        <div>
                            {item.NAMA?.length > 30 ? item.NAMA.substring(0, 30) + '...' : item.NAMA}
                        </div>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'auto 1fr',
                                gap: '2px',
                                alignItems: 'center'
                            }}
                        >
                            <span>
                                {item.QTY} x {parseInt(item.HARGA).toLocaleString()}
                            </span>
                            <span style={rightAlign}>{parseInt(item.JUMLAH).toLocaleString()}</span>
                        </div>

                        {/* Tampilkan diskon per item jika ada */}
                        {parseInt(item.HARGADISC) > 0 && (
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'auto 1fr',
                                    gap: '2px',
                                    alignItems: 'center',
                                    fontSize: '11px',
                                    color: '#555',
                                    justifyContent: 'end',
                                }}
                            >
                                <span>diskon</span>
                                <span style={rightAlign}>
                                    ({parseInt(item.HARGADISC).toLocaleString()})
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <hr style={{ borderTop: '1px dashed black', margin: '4px 0' }} />
            {/* TOTAL */}
            <div>
                <GridRow label="Total Qty" value={dataStruk?.detail_penjualan?.reduce((a, b) => a + parseInt(b.QTY), 0)} />
                <GridRow label="Sub Total" value={parseInt(dataStruk?.TOTAL).toLocaleString()} />
                {dataStruk?.DISCOUNT2 > 0 && <GridRow label="Diskon" value={`(${parseInt(dataStruk.DISCOUNT2).toLocaleString()})`} />}
                {dataStruk?.PERSPAJAK2 > 0 && <GridRow label={`PPN (${dataStruk?.PERSPAJAK2}%)`} value={`${parseInt(dataStruk?.PAJAK2).toLocaleString()}`} />}
            </div>
            <hr style={{ borderTop: '1px dashed black', margin: '4px 0' }} />
            {/* PEMBAYARAN */}
            <div style={{ marginTop: '8px' }}>
                <GridRow label="Total" value={parseInt(dataStruk?.TOTAL).toLocaleString()} />
                {dataStruk?.DONASI > 0 && <GridRow label="Donasi" value={parseInt(dataStruk.DONASI).toLocaleString()} />}
                {dataStruk?.CARABAYAR === 'Tunai' && <GridRow label="Tunai" value={parseInt(dataStruk?.NOMINAL).toLocaleString()} />}
                {dataStruk?.CARABAYAR === 'Debet' && <GridRow label="Debet" value={parseInt(dataStruk?.NOMINAL).toLocaleString()} />}
                {dataStruk?.CARABAYAR === 'QRIS' && <GridRow label="QRIS" value={parseInt(dataStruk?.NOMINAL).toLocaleString()} />}
                <GridRow label="Kembali" value={parseInt(dataStruk?.KEMBALIAN).toLocaleString()} />
                {dataStruk?.TOTALDISKONPERBARANG > 0 && <GridRow label="Diskon / Item" value={parseInt(dataStruk?.TOTALDISKONPERBARANG).toLocaleString()} />}
            </div>

            {/* INFO PEMBAYARAN DETAIL */}
            {(dataStruk?.CARABAYAR === 'Debet' || dataStruk?.CARABAYAR === 'QRIS') && (
                <div style={{ marginTop: '8px' }}>
                    {dataStruk?.CARABAYAR === 'Debet' && (
                        <>
                            <GridRow label="Kartu" value={dataStruk.NAMAKARTU} />
                            <GridRow label="No. Kartu" value={`•••• ${dataStruk.NOMORKARTU.slice(-4)}`} />
                        </>
                    )}
                    {dataStruk?.CARABAYAR === 'QRIS' && (
                        <>
                            <GridRow label="Jenis" value={dataStruk.TIPEEPAYMENT} />
                            <GridRow label="ID Transaksi" value={`•••• ${dataStruk.IDPELANGGAN.slice(-4)}`} />
                        </>
                    )}
                </div>
            )}

            {/* FOOTER */}
            <div
                style={{
                    marginTop: '10px',
                    textAlign: 'center',
                    fontSize: '10.5px',
                    borderTop: '1px dashed #000',
                    paddingTop: '2px'
                }}
            >
                <p>
                    {dataStruk?.NAMAMEMBER && dataStruk?.DAPATPOINT > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Member</span>
                                <span>{dataStruk.NAMAMEMBER}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Point Yang Didapat</span>
                                <span>{parseInt(dataStruk.DAPATPOINT).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Point Anda Saat Ini</span>
                                <span>{parseInt(dataStruk.pointAkhir).toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                    <br />
                    {configData?.infoKasir}
                    <br />
                    {configData?.telp}
                </p>
            </div>
        </div>
    );
});

export default PrintReceipt;

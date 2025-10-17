/*
 * Copyright (C) Godong
 *http://www.marstech.co.id
 *Email. info@marstech.co.id
 *Telp. 0811-3636-09
 *Office        : Jl. Margatama Asri IV, Kanigoro, Kec. Kartoharjo, Kota Madiun, Jawa Timur 63118
 *Branch Office : Perum Griya Gadang Sejahtera Kav. 14 Gadang - Sukun - Kota Malang - Jawa Timur
 *
 *Godong
 *Adalah merek dagang dari PT. Marstech Global
 *
 *License Agreement
 *Software komputer atau perangkat lunak komputer ini telah diakui sebagai salah satu aset perusahaan yang bernilai.
 *Di Indonesia secara khusus,
 *software telah dianggap seperti benda-benda berwujud lainnya yang memiliki kekuatan hukum.
 *Oleh karena itu pemilik software berhak untuk memberi ijin atau tidak memberi ijin orang lain untuk menggunakan softwarenya.
 *Dalam hal ini ada aturan hukum yang berlaku di Indonesia yang secara khusus melindungi para programmer dari pembajakan software yang mereka buat,
 *yaitu diatur dalam hukum hak kekayaan intelektual (HAKI).
 *
 *********************************************************************************************************
 *Pasal 72 ayat 3 UU Hak Cipta berbunyi,
 *' Barangsiapa dengan sengaja dan tanpa hak memperbanyak penggunaan untuk kepentingan komersial '
 *' suatu program komputer dipidana dengan pidana penjara paling lama 5 (lima) tahun dan/atau '
 *' denda paling banyak Rp. 500.000.000,00 (lima ratus juta rupiah) '
 *********************************************************************************************************
 *
 *Proprietary Software
 *Adalah software berpemilik, sehingga seseorang harus meminta izin serta dilarang untuk mengedarkan,
 *menggunakan atau memodifikasi software tersebut.
 *
 *Commercial software
 *Adalah software yang dibuat dan dikembangkan oleh perusahaan dengan konsep bisnis,
 *dibutuhkan proses pembelian atau sewa untuk bisa menggunakan software tersebut.
 *Detail Licensi yang dianut di software https://en.wikipedia.org/wiki/Proprietary_software
 *EULA https://en.wikipedia.org/wiki/End-user_license_agreement
 *
 *Lisensi Perangkat Lunak https://id.wikipedia.org/wiki/Lisensi_perangkat_lunak
 *EULA https://id.wikipedia.org/wiki/EULA
 *
 * Created on Thu May 16 2024 - 01:52:16
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */

import { Toast } from 'primereact/toast';
import { getSessionServerSide } from '../../../utilities/servertool';
import React, { useRef, useState } from 'react';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FormUpload } from '../../../lib/FormData';
import { convertToISODate, excelDateToDMY, formatAndSetDate, formatDateTable } from '../../../component/GeneralFunction/GeneralFunction';
import postData from '../../../lib/Axios';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';

export async function getServerSideProps(context) {
    return {
        props: {
            _A2F: context?.req?.cookies['_A2F']
        }
    };
}

export default function Stock(props) {
    const apiEndPointStore = '/api/konversi/stock/store';
    const apiEndPointProses = '/api/konversi/stock/proses';

    const { _A2F } = props;
    const toast = useRef(null);
    const [tgl, setTgl] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [totalQty, setTotalQty] = useState(0);
    const [konversiStockTable, setKonversiStockTable] = useState([]);
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [totalRecords, setTotalRecords] = useState(0);
    const [prosesDialog, setProsesDialog] = useState(false);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const onPage = (event) => {
        setlazyState(event);
        setFirst(event.first); // Mengatur halaman saat halaman berubah
        setRows(event.rows); // Mengatur jumlah baris per halaman
    };

    // Yang Handle Tanggal
    const handleStartDate = (e) => {
        setTgl(e.value);
    };

    const handleStartDateChange = (e) => {
        const inputValue = e.target.value;
        formatAndSetDate(inputValue, setTgl);
    };

    // Yang Handle Template
    const handleTemplate = () => {
        const filePath = '/template/TemplateStock.xlsx';
        const link = document.createElement('a');
        link.href = filePath;
        link.download = 'TemplateStock.xlsx';
        link.click();
    };

    // Yang Handle Masukin Excel
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setLoading(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const binaryString = e.target.result;
                    const workbook = XLSX.read(binaryString, { type: 'binary' });
                    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                        toast.current.show({
                            severity: "error",
                            summary: "Error",
                            detail: "Tidak ada sheet yang ditemukan",
                            life: 3000,
                        });
                        return;
                    }
                    const sheetStock = workbook.SheetNames[0];
                    const workSheetStock = workbook.Sheets[sheetStock];
                    // Ambil header dari file Excel
                    const excelHeader = XLSX.utils.sheet_to_json(workSheetStock, {
                        header: 1,
                        range: 0,
                    })[0];

                    const expectedHeader = ['GUDANG', 'BARCODE', 'KODE_LAMA', 'NAMA_PRODUK', 'GOLONGAN', 'SATUAN', 'HARGA_BELI', 'HARGA_POKOK', 'HARGA_JUAL', 'QTY'];
                    if (!excelHeader || excelHeader.length !== expectedHeader.length || !expectedHeader.every((val, index) => val === excelHeader[index])) {
                        toast.current.show({
                            severity: "error",
                            summary: "Error",
                            detail: "File yang Anda masukkan tidak sesuai",
                            life: 3000,
                        });
                        return;
                    }

                    const jsonDataStock = XLSX.utils.sheet_to_json(workSheetStock, {
                        range: 1,
                        header: expectedHeader,
                        defval: ""
                    });

                    const cleanedJsonDataStock = jsonDataStock.map((row, index) => {
                        return {
                            GUDANG: row.GUDANG !== undefined ? row.GUDANG : '',
                            BARCODE: row.BARCODE !== undefined ? row.BARCODE : '',
                            KODE_LAMA: row.KODE_LAMA !== undefined ? row.KODE_LAMA : '',
                            NAMA_PRODUK: row.NAMA_PRODUK !== undefined ? row.NAMA_PRODUK : '',
                            GOLONGAN: row.GOLONGAN !== undefined ? row.GOLONGAN : '',
                            SATUAN: row.SATUAN !== undefined ? row.SATUAN : '',
                            HARGA_BELI: row.HARGA_BELI !== undefined ? Number(row.HARGA_BELI) : 0,
                            HARGA_POKOK: row.HARGA_POKOK !== undefined ? Number(row.HARGA_POKOK) : 0,
                            HARGA_JUAL: row.HARGA_JUAL !== undefined ? Number(row.HARGA_JUAL) : 0,
                            QTY: row.QTY !== undefined ? Number(row.QTY) : 0
                        };
                    });
                    setKonversiStockTable(cleanedJsonDataStock);
                    await saveKonversiStock(cleanedJsonDataStock);
                } catch (innerError) {
                    console.error('Error saat memproses file Excel:', innerError);
                } finally {
                    setLoading(false);
                }
            };

            reader.onerror = (err) => {
                console.error('Error saat membaca file:', err);
                setLoading(false);
            };

            reader.readAsBinaryString(file);
        } catch (error) {
            console.error('Error umum:', error);
            setLoading(false);
        }
    };

    // Yang Handle Upload File
    const confirmUpload = () => {
        // if (konversiStock.GUDANG == null) {
        //     toast.current.show({ severity: "error", summary: "Error Message", detail: "Gudang Masih Kosong!", life: 3000 });
        //     return;
        // }
        document.getElementById('excelFileInput').click();
    };

    // Yang Handle Save Ke Stock, Stock_Kode dan Stock_Hp
    const saveKonversiStock = async (dataKonversiStock) => {
        setLoading(true);
        try {
            const requestBody = {
                Tgl: convertToISODate(tgl),
                data: dataKonversiStock
            };
            // const response = await FormUpload(apiEndPointStore, requestBody, {
            //     Authorization: `Bearer ${_A2F}`
            // });
            const response = await postData(apiEndPointStore, requestBody);
            const json = response.data;
            toast.current.show({
                severity: 'success',
                summary: json?.message,
                detail: 'Data Berhasil Tersimpan',
                life: 3000,
            });
        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: error.response?.data,
                detail: 'Kesalahan Proses',
                life: 3000,
            });
            setLoading(false);
        }
        setLoading(false);
    };

    // Yang Handle Proses
    const handleProses = async (dataKonversiStock) => {
        setLoading(true);
        try {
            const requestBody = {
                Tgl: convertToISODate(tgl),
                data: dataKonversiStock
            };
            const response = await postData(apiEndPointProses, requestBody);
            const json = response.data;
            if (json.status === 'success') {
                toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Berhasil Menyimpan Data', life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Kesalahan proses', life: 3000 });
            }
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Kesalahan proses', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const hideProsesDialog = () => {
        setProsesDialog(false);
    };

    const confirmProsesDialog = () => {
        setProsesDialog(true);
    };

    const prosesFooter = (
        <>
            <Button label="No" icon="pi pi-times" text onClick={hideProsesDialog} />
            <Button
                label="Yes"
                icon="pi pi-check"
                text
                onClick={() => {
                    hideProsesDialog();
                    handleProses(konversiStockTable);
                }}
            />
        </>
    );

    const rightToolbarTemplate = () => {
        return (
            <React.Fragment>
                <Button label="Download Template" icon="pi pi-download" className="p-button-primary mr-2" onClick={handleTemplate}></Button>
            </React.Fragment>
        );
    };

    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="p-inputgroup">
                    <input type="file" id="excelFileInput" accept=".xlsx, .xls" style={{ display: 'none' }} onChange={handleFileUpload} />
                    <label htmlFor="excelFileInput">
                        <Button label="Import Excel" icon="pi pi-external-link" className="p-button-primary mr-2" onClick={confirmUpload} />
                    </label>
                    <Button label="Proses" icon="pi pi-spinner" className="p-button-primary mr-2" onClick={confirmProsesDialog} />
                    <Calendar placeholder="Tanggal Cut Off" value={tgl} onChange={handleStartDate} dateFormat="dd-mm-yy" onInput={handleStartDateChange} />
                    <Button icon="pi pi-calendar" className="p-button" />
                </div>
            </React.Fragment>
        );
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>Konversi Stock</h4>
                    <hr />
                    <Toast ref={toast}></Toast>
                    <Toolbar className="mb-4" right={rightToolbarTemplate} left={leftToolbarTemplate}></Toolbar>
                    <div className="datatable-wrapper">
                        <DataTable
                            value={konversiStockTable}
                            first={first}
                            rows={rows}
                            onPage={onPage}
                            paginator
                            className="datatable-responsive"
                            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                            currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                            totalRecords={totalRecords}
                            size="small"
                            emptyMessage="Data Kosong"
                            resizableColumns
                            stripedRows
                        >
                            <Column field="GUDANG" header="GUDANG" />
                            <Column field="BARCODE" header="BARCODE" />
                            <Column field="KODE_LAMA" header="KODE LAMA" />
                            <Column field="NAMA_PRODUK" header="NAMA PRODUK" />
                            <Column field="GOLONGAN" header="GOLONGAN" />
                            <Column field="SATUAN" header="SATUAN" footer="TOTAL" />
                            <Column field="HARGA_BELI" body={(rowData) => parseInt(rowData.HARGA_BELI).toLocaleString()} header="HARGA BELI" />
                            <Column field="HARGA_POKOK" body={(rowData) => parseInt(rowData.HARGA_POKOK).toLocaleString()} header="HPP" />
                            <Column field="HARGA_JUAL" body={(rowData) => parseInt(rowData.HARGA_JUAL).toLocaleString()} header="HARGA JUAL" />
                            <Column field="QTY" body={(rowData) => parseInt(rowData.QTY).toLocaleString()} footer={parseInt(totalQty).toLocaleString()} header="QTY" />
                        </DataTable>
                    </div>
                </div>
            </div>
            {loading && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.5)', zIndex: 9999 }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                        <ProgressSpinner />
                    </div>
                </div>
            )}
            <Dialog visible={prosesDialog} header="Confirm" modal footer={prosesFooter} onHide={hideProsesDialog}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    {tgl && <span>Konversi hanya bisa dilakukan sekali dalam sehari. Melanjutkan Konversi Stock ?</span>}
                </div>
            </Dialog>
        </div>
    );
}

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
 *dibutuhkan proses kirimStock atau sewa untuk bisa menggunakan software tersebut.
 *Detail Licensi yang dianut di software https://en.wikipedia.org/wiki/Proprietary_software
 *EULA https://en.wikipedia.org/wiki/End-user_license_agreement
 *
 *Lisensi Perangkat Lunak https://id.wikipedia.org/wiki/Lisensi_perangkat_lunak
 *EULA https://id.wikipedia.org/wiki/EULA
 *
 * Created on Thu May 02 2024 - 09:25:11
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */
import { Toast } from 'primereact/toast';
import { getSessionServerSide } from '../../../utilities/servertool';
import { InputText } from 'primereact/inputtext';
import React, { useEffect, useRef, useState } from 'react';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toolbar } from 'primereact/toolbar';
import { useRouter } from 'next/router';
import Gudang from '../../component/gudang';
import postData from '../../../lib/Axios';
import { formatDatePdf, formatDateSave, formatDateTable, formatRibuan, getDBConfig, getEmail, getGudang, getKeterangan, getUserName, setLastFaktur, showError } from '../../../component/GeneralFunction/GeneralFunction';
import { Dialog } from 'primereact/dialog';
import PDFViewer from '../../../component/PDFViewer';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import BahanBaku from '../../component/bahan_baku';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import AdjustPrintMarginLaporan from '../../component/adjustPrintMarginLaporan';

export const getServerSideProps = async (context) => {
    const sessionData = await getSessionServerSide(context, '/pembelian/bahan_baku');
    if (sessionData?.redirect) {
        return sessionData;
    }

    return {
        props: {
            _A2F: context?.req?.cookies['_A2F']
        }
    };
};

export default function FormBahanBaku(props) {
    const apiEndPointGetFaktur = '/api/get_faktur';
    const apiEndPointGetBarcode = '/api/bahan-baku/get-barcode';
    const apiEndPointStorePenerimaan = '/api/penerimaan-bahan-baku/store';
    const apiEndPointStorePengeluaran = '/api/pengeluaran-bahan-baku/store';
    const apiEndPointGetDataEditPenerimaan = '/api/penerimaan-bahan-baku/get-data-edit';
    const apiEndPointGetDataEditPengeluaran = '/api/pengeluaran-bahan-baku/get-data-edit';
    const apiEndPointUpdatePenerimaan = '/api/penerimaan-bahan-baku/update';
    const apiEndPointUpdatePengeluaran = '/api/pengeluaran-bahan-baku/update';
    const apiEndPointGetDataFaktur = '/api/mutasi-stock/get-data';

    const toast = useRef(null);
    const router = useRouter();
    const { status, jenis } = router.query;
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [readOnlyEdit, setReadOnlyEdit] = useState(false);
    const [loading, setLoading] = useState(false);
    const [kirimStock, setKirimStock] = useState([]);
    const [addKirimStock, setAddKirimStock] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [faktur, setFaktur] = useState(null);
    const [gudangDialog, setGudangDialog] = useState(false);
    const [kodeGudang, setKodeGudang] = useState('');
    const [keteranganGudang, setKeteranganGudang] = useState('');
    const [bahanBakuDialog, setBahanBakuDialog] = useState(false);
    const [timer, setTimer] = useState(null);
    const formattedJenis = jenis === 'penerimaan' ? 'Penerimaan ' : 'Pengeluaran ';
    const formattedStatus = status === 'create' ? 'Tambah ' : 'Ubah ';
    const fileName = `bahan-baku-${new Date().toISOString().slice(0, 10)}`;
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(true);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [orientation, setOrientation] = useState('portrait');
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
    const [pdfUrl, setPdfUrl] = useState('');
    // PDF OLD
    const [marginTop, setMarginTop] = useState(10); // JSPDF
    const [marginLeft, setMarginLeft] = useState(10); // JSPDF
    const [marginRight, setMarginRight] = useState(10); // JSPDF
    const [marginBottom, setMarginBottom] = useState(10); // JSPDF
    const [tableWidth, setTableWidth] = useState(800); // JSPDF
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const hidePDF = async () => {
        setjsPdfPreviewOpen(false);
        await setLastFaktur('BK');
        router.push('/transaksistock/mutasi-gudang');
    };

    const onPage = (event) => {
        setlazyState(event);
    };

    useEffect(() => {
        const Faktur = localStorage.getItem('Faktur');
        if (status === 'update') {
            setFaktur(Faktur);
            getDataEdit();
            setReadOnlyEdit(true);
            setIsUpdateMode(true);
        } else {
            loadLazyData();
            setIsUpdateMode(false);
        }
    }, []);

    const loadLazyData = async () => {
        setLoading(true);
        const kode = jenis === 'penerimaan'
            ? 'PN'
            : jenis === 'pengeluaran'
                ? 'PM'
                : 'BK';

        try {
            let requestBody = {
                Kode: kode,
                Len: 6
            };
            const vaData = await postData(apiEndPointGetFaktur, requestBody);
            const json = vaData.data;
            setFaktur(json);
            setKirimStock((prevKirimStock) => ({
                ...prevKirimStock,
                Faktur: json
            }));
        } catch (error) {
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    // Yang Handle Get Data Edit
    const getDataEdit = async () => {
        setLoading(true);
        const Faktur = localStorage.getItem('Faktur');
        try {
            let requestBody = {
                Faktur: Faktur
            };
            let endPoint;
            if (Faktur.startsWith('PN')) {
                endPoint = apiEndPointGetDataEditPenerimaan;
            } else if (Faktur.startsWith('PM')) {
                endPoint = apiEndPointGetDataEditPengeluaran;
            }
            const vaData = await postData(endPoint, requestBody);
            const json = vaData.data.data;
            setKodeGudang(json.Gudang);
            setKeteranganGudang(json.KetGudang);
            setKirimStock(json);
            setAddKirimStock(json.tabel);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    // Yang Handle Save
    const createDataObject = (_kirimStock, _addKirimStock) => {
        let data = {
            Faktur: isUpdateMode ? _kirimStock.Faktur : faktur,
            Tgl: isUpdateMode ? _kirimStock.Tgl : formatDateSave(_kirimStock.Tgl || new Date()),
            Gudang: kodeGudang,
            Subtotal: totHB,
            Total: totHB,
            tabel: _addKirimStock
                .map((item) => {
                    const Qty = item.QTY !== null ? item.QTY : 0;
                    if (Qty > 0) {
                        return {
                            Kode: item.KODE,
                            Barcode: item.BARCODE,
                            Qty: item.QTY,
                            Harga: item.HARGABELI,
                            Satuan: item.SATUAN,
                            Jumlah: item.HARGABELI * item.QTY
                        };
                    } else {
                        return null;
                    }
                })
                .filter((item) => item !== null)
        };
        return data;
    };

    const saveKirimStock = async (e) => {
        e.preventDefault();
        let _kirimStock = { ...kirimStock };
        let _addKirimStock = [...addKirimStock];
        let _data = createDataObject(_kirimStock, _addKirimStock);
        if (_data.Faktur == null) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Faktur Masih Kosong!', life: 3000 });
            return;
        }

        if (_data.Tgl == null) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tanggal Masih Kosong!', life: 3000 });
            return;
        }

        if (_data.Gudang == null || _data.Gudang == '') {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Gudang Masih Kosong!', life: 3000 });
            return;
        }

        if (_data.tabel.length <= 0) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong!', life: 3000 });
            return;
        }

        try {
            let endPoint;
            if (jenis == 'penerimaan' && status == 'create') {
                endPoint = apiEndPointStorePenerimaan;
            } else if (jenis == 'pengeluaran' && status == 'create') {
                endPoint = apiEndPointStorePengeluaran;
            } else if (jenis == 'penerimaan' && status == 'update') {
                endPoint = apiEndPointUpdatePenerimaan;
            } else if (jenis == 'pengeluaran' && status == 'update') {
                endPoint = apiEndPointUpdatePengeluaran;
            }
            const vaData = await postData(endPoint, _data);
            const json = vaData.data;
            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Berhasil Menyimpan Data', life: 3000 });
            router.push('/pembelian/bahan_baku');
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Kesalahan proses', life: 3000 });
        }
    };

    // Yang Handle Inputan
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _data = { ...kirimStock };
        _data[`${name}`] = val;
        setKirimStock(_data);
    };

    // Yang Handle Gudang
    const toggleGudang = () => {
        setGudangDialog(true);
    };

    const handleGudangData = (gudangKode, gudangKet) => {
        setKodeGudang(gudangKode);
        setKeteranganGudang(gudangKet);
        setKirimStock((prevKirimStock) => ({
            ...prevKirimStock,
            Gudang: gudangKode
        }));
    };

    // Yang Handle Barcode
    const toggleBahanBaku = () => {
        setBahanBakuDialog(true);
    };

    const handleBahanBakuData = (produkFaktur) => {
        onRowSelectBarcode({ data: produkFaktur });
    };

    // Yang Handle Barcode Enter
    const handleBarcodeKeyDown = async (event) => {
        clearTimeout(timer);
        const newTimer = setTimeout(async () => {
            // Periksa apakah tombol yang ditekan adalah Enter
            if (event.key === 'Enter') {
                const barcodeInput = document.getElementById('barcode');
                const enteredBarcode = barcodeInput.value;

                if (enteredBarcode.trim() === '') {
                    return;
                }
                // Periksa apakah barcode yang dimasukkan mencakup kuantitas
                const barcodeDanQty = enteredBarcode.split('*');
                let enteredQty = 1;
                let enteredBarcodeValue = enteredBarcode;

                if (barcodeDanQty.length === 2) {
                    enteredQty = parseFloat(barcodeDanQty[0]);
                    enteredBarcodeValue = barcodeDanQty[1];
                }

                const params = { data: { KODE_TOKO: enteredBarcodeValue }, skipSelectBarcode: true, qty: enteredQty };
                await onRowSelectBarcode(params);

                barcodeInput.value = '';
            }
        }, 100);
        setTimer(newTimer);
    };

    // Yang Handle Barcode Pilih dari Tabel
    const onRowSelectBarcode = async (event) => {
        const selectedKode = event.data.KODE_TOKO;
        const enteredQty = event.qty || 1;
        const selectedBarcode = { KODE_TOKO: selectedKode };
        // return;
        if (!selectedBarcode) {
            setBahanBakuDialog(false);
            return;
        }
        try {
            // --- API
            const vaTable = await postData(apiEndPointGetBarcode, { Barcode: `%${selectedKode}%` });
            const json = vaTable.data;

            if (json.status === '99') {
                toast.current.show({
                    severity: 'error',
                    detail: json.message,  // Menampilkan pesan yang diterima
                    summary: 'Request Failed',  // Menambahkan detail kesalahan secara umum
                    life: 3000  // Durasi tampilan pesan toast (dalam milidetik)
                });
                return;
            }

            const valBarcode = json[0].BARCODE;
            const existingIndex = addKirimStock.findIndex((item) => item.BARCODE === valBarcode);
            // const qtyToAdd = json.QTY || 1;
            const qtyToAdd = json.QTY || enteredQty || 1;
            //  --- Cek ada data yang sama di Tabel addKirimStock
            if (existingIndex !== -1) {
                // Sudah ada data dengan kode dan tanggal kadaluarsa yang sama
                const existingItem = addKirimStock[existingIndex];
                // Tambahkan jumlah jika tanggal kadaluarsa sama
                const updatedQTY = existingItem.QTY + qtyToAdd;
                setAddKirimStock((prevAddKirimStock) => {
                    const updatedAddKirimStock = [...prevAddKirimStock];
                    updatedAddKirimStock[existingIndex] = {
                        ...existingItem,
                        QTY: updatedQTY
                    };
                    return updatedAddKirimStock;
                });
            } else {
                // Tidak ada data dengan kode dan tanggal kadaluarsa yang sama, tambahkan data baru
                const addedData = json[0];
                setAddKirimStock((prevAddKirimStock) => [...prevAddKirimStock, { ...addedData, QTY: qtyToAdd }]);
            }
            const newDataRow = document.getElementById('new-data-row'); // Ganti dengan ID atau ref dari elemen yang menampilkan data baru dimasukkan
            if (newDataRow) {
                newDataRow.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Menggulirkan elemen baru ke tengah layar jika perlu
            }
            setBahanBakuDialog(false);
        } catch (error) {
            console.error('Error fetching barcode data:', error);
            // Handle the error accordingly, e.g., show an error message
            setBahanBakuDialog(false);
        }
    };

    // Yang Handle Edit in Cell
    const cellEditor = (options) => {
        return textEditor(options);
    };

    const onQtyUpdate = (updatedAddStock) => {
        setAddKirimStock(updatedAddStock);
    };

    const deleteSelectedRow = (rowData) => {
        const updatedAddKirimStock = addKirimStock.filter((row) => row !== rowData);
        setAddKirimStock(updatedAddKirimStock);
    };

    const onCellEditComplete = (e) => {
        let { rowData, newValue, field } = e;
        switch (field) {
            case 'QTY':
                if (!isNaN(newValue)) {
                    // Check if newValue is a valid number
                    const editedQty = parseFloat(newValue);
                    // Mencari indeks dari entri yang sesuai dalam addKirimStock
                    const rowIndex = addKirimStock.findIndex((item) => item.BARCODE === rowData.BARCODE);
                    // Mendapatkan sisa stock dari baris yang sesuai
                    const sisaStock = addKirimStock[rowIndex].SISASTOCKBARANG;
                    // // Cek sisa stock - QTY KIRIM
                    if (jenis === 'pengeluaran' && editedQty > parseInt(sisaStock)) {
                        showError(toast, "Barang yang dikeluarkan melebihi stock yang tersedia");
                        return;
                    }
                    if (!isNaN(editedQty)) {
                        // Check if editedQty is a valid number
                        if (editedQty === 0 || editedQty === '') {
                            deleteSelectedRow(rowData);
                        } else {
                            const updatedAddItem = addKirimStock.map((item) => {
                                if (item.BARCODE === rowData.BARCODE) {
                                    const addedData = rowData;
                                    const initialQty = addedData.QTY;
                                    const qtyToAdd = editedQty - initialQty;

                                    return { ...item, QTY: editedQty };
                                } else {
                                    return item;
                                }
                            });

                            setAddKirimStock(updatedAddItem);

                            // Call a function in index.js to handle the updated addKirimStock
                            if (onQtyUpdate) {
                                onQtyUpdate(updatedAddItem);
                            }
                        }
                    } else {
                        // Handle the case when newValue is not a valid number
                        console.error('Invalid input. Please enter a valid number for QTY.');
                    }
                } else {
                    // Handle the case when newValue is not a valid number
                    console.error('Invalid input. Please enter a valid number for QTY.');
                }
                break;
            default:
                break;
        }
    };

    // Yang Handle Cetak Slip
    const cetakSlip = async () => {
        try {
            let format = 'a4';
            if (selectedPaperSize === 'Letter') {
                format = 'letter';
            } else if (selectedPaperSize === 'Legal') {
                format = 'legal';
            }

            let requestBody = {
                Faktur: faktur
            };
            const vaTable = await postData(apiEndPointGetDataFaktur, requestBody);
            const jsonHeader = vaTable.data;
            const jsonDetail = vaTable.data.data;

            const marginLeftInMm = parseFloat(marginLeft);
            const marginTopInMm = parseFloat(marginTop);
            const marginRightInMm = parseFloat(marginRight);
            const marginBottomInMm = parseFloat(marginBottom);
            const tableWidthInMm = parseFloat(tableWidth);

            const doc = new jsPDF({
                orientation,
                unit: 'mm',
                format,
                left: marginLeftInMm,
                right: marginRightInMm,
                putOnlyUsedFonts: true
            });

            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const userName = await getUserName(await getEmail());
            const yOffsetForm = marginTop + 25;
            const lineHeightForm = 4;

            const labelXPosition = marginLeft + 14;
            const label2XPosition = pageWidth - 90; // Posisi label2 di sebelah kanan
            const valueXPosition = labelXPosition + 40; // Posisi nilai di sebelah kiri
            const value2XPosition = label2XPosition + 40; // Posisi nilai di sebelah kanan

            const judulLaporan = '';
            const periodeLaporan = '';
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = jsonDetail.map((item) => [item.No, item.Kode, item.Nama, parseInt(item.HJ).toLocaleString(), parseInt(item.Qty).toLocaleString(), item.Satuan, parseInt(item.TotalHJ).toLocaleString()]);
            tableData.push(['', '', 'Total Items : ' + parseInt(jsonHeader.total_data).toLocaleString(), '', parseInt(jsonHeader.total).toLocaleString(), '', parseInt(jsonHeader.total_HJ).toLocaleString()]);

            doc.setFontSize(10);
            const dataGrid = [
                {
                    label: 'Faktur',
                    value: faktur,
                    label2: 'Tanggal',
                    value2: formatDatePdf(jsonHeader.tgl)
                },
                {
                    label: 'Dari',
                    value: jsonHeader.gudang_kirim,
                    label2: 'Ke',
                    value2: jsonHeader.gudang_terima
                }
            ];
            dataGrid.forEach((item, index) => {
                const yPosition = yOffsetForm + index * lineHeightForm;
                doc.text(item.label.toString(), labelXPosition, yPosition);
                doc.text(' : ', valueXPosition, yPosition, 'center');
                doc.text(item.value.toString(), valueXPosition + 5, yPosition);
                if (item.label2) {
                    // Cetak label2 dan value2 di sebelah kanan
                    doc.text(item.label2.toString(), label2XPosition, yPosition);
                    doc.text(' : ', value2XPosition, yPosition, 'center');
                    doc.text(item.value2.toString(), value2XPosition + 5, yPosition);
                }
            });

            doc.autoTable({
                startY: 45,
                head: [['NO', 'ITEM', 'NAMA BARANG', 'HARGA', 'QTY', 'UOM', 'TOTAL']],
                body: tableData,
                theme: 'plain',
                margin: {
                    top: marginTopInMm,
                    left: marginLeftInMm,
                    right: marginRightInMm
                },
                styles: {
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1,
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontSize: 8
                },
                columnStyles: {
                    0: { halign: 'center' },
                    3: { halign: 'right' },
                    4: { halign: 'right' },
                    6: { halign: 'right' }
                },
                headerStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                didDrawCell: (data) => {
                    if (data.row.index !== null && data.cell.raw !== null) {
                        const { doc, row, column, styles } = data;
                        doc.setFillColor(255, 255, 255);
                    }
                },
                didDrawRow: (data) => {
                    if (data.row.index !== null) {
                        const rowData = tableData[data.row.index];
                        if (rowData && rowData.Keterangan === 'ASET') {
                            // Jika Jenis === 'I', maka set gaya teks menjadi bold
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                },
                didDrawPage: async function (data) {
                    addPageInfo(doc, userName, marginRightInMm);
                }
            });

            await Footer({ doc, marginLeftInMm, marginTopInMm, marginRightInMm });
            const pdfDataUrl = doc.output('datauristring');
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
        } catch (error) {
        }
    };

    const actionBodyTabel = (rowData) => {
        return <Button icon="pi pi-trash" style={{ backgroundColor: '#ca656f', border: '1px solid #ca656f' }} className="p-button-danger p-button p-button-sm mr-2" onClick={() => deleteSelectedRow(rowData)} />;
    };

    const textEditor = (options) => {
        return <InputText value={options.value} keyfilter={/^[0-9,.]*$/} onChange={(e) => options.editorCallback(e.target.value)} />;
    };

    const rightFooterTemplate = (rowData) => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Save" className="p-button-primary p-button mr-2" onClick={saveKirimStock} />
                    <Button
                        label="Cancel"
                        className="p-button-secondary p-button"
                        onClick={() => {
                            router.push('/pembelian/bahan_baku');
                        }}
                    />
                </div>
            </React.Fragment>
        );
    };

    //  Yang Handle Laporan
    const handleAdjust = async () => {
        cetakSlip();
    };

    const totQty = addKirimStock ? addKirimStock.reduce((accumulator, item) => accumulator + parseInt(item.QTY), 0) : 0;
    const totHB = addKirimStock ? addKirimStock.reduce((accumulator, item) => accumulator + parseInt(item.HARGABELI * item.QTY), 0) : 0;

    let footerGroup = (
        <ColumnGroup>
            <Row>
                <Column headerStyle={{ textAlign: 'center' }} footer="Total:" colSpan={4} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`${formatRibuan(totQty)}`} style={{ textAlign: 'center' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`${formatRibuan(totHB)}`} style={{ textAlign: 'center' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} />
            </Row>
        </ColumnGroup>
    );

    return (
        <div className="full-page">
            <div className="card">
                <h4>{`${formattedStatus} ${formattedJenis} Bahan Baku`}</h4>
                <hr></hr>
                <Toast ref={toast}></Toast>
                <div>
                    <div className="formgrid grid">
                        <div className="field col-6 mb-2 lg:col-6">
                            <div className="formgrid grid">
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label htmlFor="faktur">Faktur</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly value={faktur}></InputText>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-6">
                            <div className="formgrid grid">
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label htmlFor="tgl">Tanggal</label>
                                    <div className="p-inputgroup">
                                        <Calendar disabled={readOnlyEdit} value={kirimStock.Tgl && kirimStock.Tgl ? new Date(kirimStock.Tgl) : new Date()} onChange={(e) => onInputChange(e, 'Tgl')} id="tgl" showIcon dateFormat="dd-mm-yy"></Calendar>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-6">
                            <label htmlFor="supplier">Gudang</label>
                            <div className="p-inputgroup">
                                <InputText value={kodeGudang} readOnly />
                                <Button icon="pi pi-search" onClick={toggleGudang} className="p-button" />
                                <InputText value={keteranganGudang} readOnly />
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-6">
                            <label htmlFor="supplier">Barcode</label>
                            <div className="p-inputgroup">
                                <InputText id="barcode" onKeyDown={handleBarcodeKeyDown} />
                                <Button icon="pi pi-search" className="p-button" onClick={toggleBahanBaku} />
                            </div>
                        </div>
                    </div>
                </div>
                <hr></hr>
                <DataTable
                    loading={loading}
                    value={addKirimStock}
                    size="small"
                    lazy
                    dataKey="Kode"
                    // rows={10}
                    editMode="cell"
                    className="datatable-responsive editable-cells-"
                    footerColumnGroup={footerGroup}
                    first={lazyState.first}
                    totalRecords={totalRecords}
                    onPage={onPage}
                    scrollable
                    scrollHeight="200px"
                >
                    <Column field="BARCODE" header="BARCODE"></Column>
                    <Column field="NAMA" header="NAMA"></Column>
                    <Column field="SATUAN" header="SATUAN"></Column>
                    <Column
                        field="SISASTOCKBARANG"
                        body={(rowData) => {
                            const value = rowData.SISASTOCKBARANG ? parseInt(rowData.SISASTOCKBARANG).toLocaleString() : "";
                            return value;
                        }}
                        header="SISA STOCK"
                        bodyStyle={{ textAlign: "center" }}
                    ></Column>
                    <Column
                        field="QTY"
                        header="QTY"
                        editor={(options) => cellEditor(options)}
                        onCellEditComplete={onCellEditComplete}
                        body={(rowData) => {
                            const value = rowData.QTY ? parseInt(rowData.QTY).toLocaleString() : "";
                            return value;
                        }}
                        bodyStyle={{ textAlign: 'center' }}
                    ></Column>
                    <Column headerStyle={{ textAlign: "center" }} field="HARGA BELI" bodyStyle={{ textAlign: "right" }} body={(rowData) => formatRibuan(rowData.HARGABELI)} header="HARGABELI" ></Column>
                    <Column header="ACTION" body={actionBodyTabel} ></Column>
                </DataTable>
                <br></br>
                <Toolbar className="mb-4" right={rightFooterTemplate}></Toolbar>
            </div>
            <Gudang gudangDialog={gudangDialog} setGudangDialog={setGudangDialog} btnGudang={toggleGudang} handleGudangData={handleGudangData} />
            <BahanBaku bahanBakuDialog={bahanBakuDialog} setBahanBakuDialog={setBahanBakuDialog} btnBahanBakuDialog={toggleBahanBaku} handleBahanBakuData={handleBahanBakuData}></BahanBaku>
            <AdjustPrintMarginLaporan loadingPreview={loadingPreview} adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} handleAdjust={handleAdjust} />
            <Dialog visible={jsPdfPreviewOpen} onHide={hidePDF} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                <div className="p-dialog-content">
                    <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
                </div>
            </Dialog>
        </div>
    );
}

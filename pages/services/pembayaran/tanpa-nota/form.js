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
 * Created on Thu Sep 19 2024 - 01:58:07
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import postData from '../../../../lib/Axios';
import { formatDatePdf, getDBConfig, getEmail, getUserName } from '../../../../component/plugin/services/GeneralFunction/GeneralFunction';
import PDFViewer from '../../../../component/plugin/services/PDFViewer';
import PilihJasaBarang from '../../../../component/plugin/services/pilihJasaBarang';
import { getSessionServerSide } from '../../../../utilities/servertool';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }

    return {
        props: {}
    };
}

export default function PembayaranTanpaNota() {
    const router = useRouter();
    const [faktur, setFaktur] = useState(null);
    const [loading, setLoading] = useState(false);
    const toast = useRef(null);
    const [readOnlyEdit, setReadOnlyEdit] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [pembayaran, setPembayaran] = useState({});
    const [barangList, setBarangList] = useState([{ KODE: '', NAMA: '', KETERANGAN: '', STATUSAMBIL: 'Antrian', services: [], ESTIMASIHARGA: 0 }]);
    const [tgl, setTgl] = useState(new Date());
    const [estimasiSelesai, setEstimasiSelesai] = useState(new Date());
    const [servicesAndStock, setServicesAndStock] = useState([]);
    const [errors, setErrors] = useState({});
    const [totalHarga, setTotalHarga] = useState(0);
    const [PPn, setPPn] = useState(0);
    const [totalHargaDanPPN, setTotalHargaDanPPN] = useState(0);
    const [persPPn, setPersPPn] = useState(0);
    const [sisa, setSisa] = useState(0);
    const [isNewRecord, setIsNewRecord] = useState(true);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [orientation, setOrientation] = useState('portrait');
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
    const [pdfUrl, setPdfUrl] = useState('');
    // PDF OLD
    const [today, setToday] = useState(new Date());
    const [namaToko, setNamaToko] = useState(null);
    const [alamatToko, setAlamatToko] = useState(null);
    const [teleponToko, setTeleponToko] = useState(null);
    const [kotaToko, setKotaToko] = useState(null);
    const [marginTop, setMarginTop] = useState(10); // JSPDF
    const [marginLeft, setMarginLeft] = useState(10); // JSPDF
    const [marginRight, setMarginRight] = useState(10); // JSPDF
    const [marginBottom, setMarginBottom] = useState(10); // JSPDF
    const [tableWidth, setTableWidth] = useState(800); // JSPDF
    const paperSizes = [
        { name: 'A4', value: 'A4' },
        { name: 'Letter', value: 'Letter' },
        { name: 'Legal', value: 'Legal' }
    ]; // JSPDF
    const orientationOptions = [
        { label: 'Potret', value: 'portrait' },
        { label: 'Lanskap', value: 'landscape' }
    ]; // JSPDF
    const handlePaperSizeChange = (event) => {
        setSelectedPaperSize(event.target.value);
    }; // JSPDF
    const handleOrientationChange = (event) => {
        setOrientation(event.target.value);
    }; // JSPDF
    // JSPDF
    // PDF OLD

    const apiEndPointGetFaktur = '/api/get_faktur';
    const apiEndPointGetService = '/api/service/stock/data';
    const apiEndPointStore = '/api/pembayaran/store';
    const apiEndPointGetDataFaktur = '/api/pembayaran/get/data';
    const apiEndPointUpdate = '/api/pembayaran/update';

    const onPage = (event) => {
        setlazyState(event);
    };

    useEffect(() => {
        const { status } = router.query;
        const Faktur = localStorage.getItem('FAKTUR');
        if (status === 'update') {
            setFaktur(Faktur);
            fetchDataForEdit();
            setReadOnlyEdit(true);
            setIsUpdateMode(true);
        } else {
            loadLazyData();
            setIsUpdateMode(false);
        }

        const fetchPPN = async () => {
            let ppnValue = await getDBConfig('msPPN');
            setPersPPn(ppnValue);
        };
        fetchPPN();
        fetchServicesAndStock();
    }, [router.query]);

    const getTotalHarga = async () => {
        const total = barangList.reduce((acc, item) => {
            return acc + (item.ESTIMASIHARGA || 0);
        }, 0);
        setTotalHarga(total);
        const totalPPn = (total * persPPn) / 100;
        setPPn(totalPPn);
        const totalHargadanPPN = total + totalPPn;
        setTotalHargaDanPPN(totalHargadanPPN);
        const sisa = totalHargadanPPN - pembayaran.NOMINALBAYAR;
        setSisa(sisa);
    };

    useEffect(() => {
        getTotalHarga();
    }, [barangList, PPn]);

    const loadLazyData = async () => {
        try {
            let requestBody = {
                Kode: 'INV',
                Len: 6
            };
            const vaData = await postData(apiEndPointGetFaktur, requestBody);
            const json = vaData.data;
            setFaktur(json);
            setPembayaran((prevPembayaran) => ({
                ...prevPembayaran,
                FAKTUR: json
            }));

            setPembayaran({
                STATUS: 0,
                FAKTUR: json,
                KODE: '',
                TGL: new Date().toISOString().split('T')[0],
                TGLBAYAR: new Date().toISOString().split('T')[0],
                CUSTOMER: '',
                NOTELEPON: '',
                ESTIMASISELESAI: new Date().toISOString().split('T')[0],
                ESTIMASIHARGA: 0,
                HARGA: 0,
                PPN: 0,
                NOMINALBAYAR: 0,
                DP: 0,
                PENERIMA: '',
                ANTRIAN: 0
            });

            setBarangList([
                {
                    KODE: '',
                    NAMA: '',
                    KETERANGAN: '',
                    STATUSAMBIL: 'Antrian',
                    services: [],
                    ESTIMASIHARGA: 0
                }
            ]);
        } catch (error) {
            console.error('Error while loading data:', error);
        }
    };

    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        let updatedPembayaran = { ...pembayaran, [name.toUpperCase()]: val };
        if (name === 'NominalBayar') {
            const uangMuka = parseInt(updatedPembayaran.DP) || 0;
            const NominalBayar = parseInt(val);
            setSisa(parseInt(totalHarga) + parseInt(PPn) - NominalBayar);
        }

        setPembayaran(updatedPembayaran);
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let updatedPembayaran = { ...pembayaran, [name.toUpperCase()]: val };
        setPembayaran(updatedPembayaran);
    };

    const fetchServicesAndStock = async () => {
        try {
            const data = await postData(apiEndPointGetService, lazyState);
            setServicesAndStock(data.data);
        } catch (error) {
            console.error('Error fetching services and stock:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Terjadi kesalahan saat memuat data jasa dan barang', life: 3000 });
        }
    };

    const fetchDataForEdit = async () => {
        const Faktur = localStorage.getItem('FAKTUR');
        try {
            setLoading(true);
            let requestBody = {
                Faktur: Faktur
            };

            // Fetch data using postData
            const vaData = await postData(apiEndPointGetDataFaktur, requestBody);
            const json = vaData.data;
            setPembayaran(json);
            setBarangList(json.barangList);
            setTotalHarga(json.TOTALHARGA);
            setPPn(json.PPN);
            setSisa(json.SISA);
            setIsNewRecord(false);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const rightFooterTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Save" className="p-button-primary p-button mr-2" onClick={saveData} />
                    <Button
                        label="Cancel"
                        className="p-button-secondary p-button"
                        onClick={() => {
                            router.push('/plugin/services/pembayaran');
                        }}
                    />
                </div>
            </React.Fragment>
        );
    };

    const saveData = async (e) => {
        setErrors({});

        const dataToSave = {
            ...pembayaran,
            ESTIMASIHARGA: totalHarga,
            HARGA: totalHarga,
            PPN: PPn,
            barangList
        };

        console.log(dataToSave);

        if (dataToSave.FAKTUR == null || dataToSave.FAKTUR == '') {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Faktur Masih Kosong!', life: 3000 });
            return;
        }

        if (dataToSave.CUSTOMER == null || dataToSave.CUSTOMER == '') {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Pemilik Masih Kosong!', life: 3000 });
            return;
        }

        if (dataToSave.NOTELEPON == null || dataToSave.NOTELEPON == '') {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'No. Telepon Masih Kosong!', life: 3000 });
            return;
        }

        if (dataToSave.NOMINALBAYAR == 0 || dataToSave.NOMINALBAYAR == '') {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Nominal Bayar Masih Kosong!', life: 3000 });
            return;
        }

        if (dataToSave.barangList.some((item) => item.services.length <= 0)) {
            toast.current.show({
                severity: 'error',
                summary: 'Error Message',
                detail: 'Tidak Ada yang Perlu Diservice!',
                life: 3000
            });
            return;
        }

        try {
            let endPoint;
            if (isUpdateMode) {
                endPoint = apiEndPointUpdate;
            } else {
                endPoint = apiEndPointStore;
            }

            const vaData = await postData(endPoint, dataToSave);
            let data = vaData.data;
            console.log(data.code);

            if (data.code === '200') {
                toast.current?.show({ severity: 'success', summary: 'Success', detail: `Berhasil ${isNewRecord ? 'menambahkan' : 'memperbarui'} Nota Service`, life: 3000 });
                setShowPreview(true);
            } else if (data.code === '409') {
                toast.current.show({ severity: 'error', summary: data.message, detail: 'Kode Tidak Boleh Sama', life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: data.message, detail: data.messageValidator, life: 3000 });
            }
        } catch (error) {
            console.error('Error saving service:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Terjadi kesalahan dalam menyimpan Pembayaran', life: 3000 });
        }
    };

    const hidePreview = async () => {
        try {
            setShowPreview(false);
            router.push('/plugin/services/pembayaran');
            // await setLastFaktur('SV');
        } catch (error) {
            return console.log(error);
        }
    };

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
            const jsonDetail = vaTable.data.barangList;
            const detailItems = Array.isArray(jsonDetail) ? jsonDetail : [jsonDetail];

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

            const headerTitle = await getDBConfig('namaPerusahaan');
            const address = await getDBConfig('alamatPerusahaan');
            const phoneNumber = `No. Telp : ` + (await getDBConfig('teleponPerusahaan'));
            const judulSlip = 'Nota Pembayaran Servis';

            // Fungsi untuk menambahkan judul dan informasi tanggal pada setiap halaman
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text(headerTitle, 14, marginTopInMm + 5);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(address, 14, marginTopInMm + 10);
            doc.text(phoneNumber, 14, marginTopInMm + 15);

            // Mengatur font dan ukuran
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            const textWidth = doc.getTextWidth(judulSlip);
            const textX = (pageWidth - textWidth) / 2;
            doc.text(judulSlip, textX, marginTopInMm + 25);
            let previousItem = null;
            const tableData = jsonDetail.flatMap((item) =>
                item.services.map((service, index) => {
                    // Cek apakah item saat ini sama dengan item sebelumnya
                    const showItemDetails = previousItem !== item.KODE;
                    previousItem = item.Kode; // Set item saat ini sebagai previousItem untuk pengecekan berikutnya

                    return [
                        showItemDetails ? item.NAMA : '', // Tampilkan nama barang hanya jika item baru
                        showItemDetails ? item.KETERANGAN : '', // Tampilkan keterangan hanya jika item baru
                        service.NAMA, // Tampilkan estimasi harga hanya jika item baru
                        parseFloat(service.QTY).toLocaleString(), // QTY dari services
                        parseFloat(service.HARGA).toLocaleString(), // Harga dari services
                        parseFloat(service.TOTAL_HARGA).toLocaleString() // Total harga dari services
                    ];
                })
            );
            // const tableData1 = jsonDetail.map((item) => [item.NamaBarang, item.Keterangan, item.Penanganan, parseInt(item.Qty).toLocaleString(), parseInt(item.Harga).toLocaleString(), parseInt(item.Total).toLocaleString()]);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);

            const dataGrid = [
                {
                    label: 'Faktur Pembayaran',
                    value: jsonHeader.FAKTUR,
                    label2: 'Tanggal Pembayaran',
                    value2: formatDatePdf(jsonHeader.TGLBAYAR)
                },
                {
                    label: 'Customer',
                    value: jsonHeader.CUSTOMER,
                    label2: 'No. Telepon',
                    value2: jsonHeader.NOTELEPON
                }
            ];

            dataGrid.forEach((item, index) => {
                const yPosition = yOffsetForm + index * lineHeightForm + 8;
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
                startY: 60,
                head: [['BARANG', 'KETERANGAN', 'SERVICE/STOCK', 'QTY', 'HARGA', 'TOTAL']],
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
                    3: { halign: 'right' },
                    4: { halign: 'right' },
                    5: { halign: 'right' }
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
                    const totalPages = doc.internal.getNumberOfPages();
                    const currentDate = new Date().toLocaleString(); // Menambahkan datetime
                    const pageInfo = 'Page ' + doc.internal.getCurrentPageInfo().pageNumber + ' of ' + totalPages;
                    const userInfo = userName + ' | ' + currentDate; // Menambahkan informasi pengguna
                    const pageTextWidth = Math.max(doc.getTextWidth(pageInfo), doc.getTextWidth(userInfo));
                    const pageTextX = pageWidth - pageTextWidth - 10; // Posisi di pojok kanan
                    const pageTextY = pageHeight - 10;

                    doc.setFontSize(8);
                    doc.text(pageInfo, pageTextX + 57, pageTextY); // Menambahkan informasi halaman
                    doc.text(userInfo, pageTextX + 12, pageTextY + 5); // Menambahkan informasi pengguna
                }
            });

            const totalKeseluruhan = parseInt(jsonHeader.TOTALHARGA).toLocaleString();
            const ppn = parseInt(jsonHeader.PPN).toLocaleString();
            const totalBersih = parseInt(jsonHeader.TOTALBERSIH).toLocaleString();
            // const
            // Aligning to the right
            const alignRightX = pageWidth - marginRightInMm - 5; // Adjust X position as needed

            // Get the final Y position after the table
            const finalY = doc.autoTable.previous.finalY + 10;
            doc.setFontSize(10);

            const dataGrid2 = [
                {
                    label: 'Sub Total',
                    value: `Rp ${totalKeseluruhan}`
                },
                {
                    label: 'PPN (11%)',
                    value: `Rp ${ppn}`
                },
                {
                    label: 'Total',
                    value: `Rp ${totalBersih}`
                },
                {
                    label: 'Nominal Bayar',
                    value: `Rp ${parseInt(jsonHeader.NOMINALBAYAR).toLocaleString()}`
                }
            ];

            if (parseInt(jsonHeader.SISA) > 0) {
                dataGrid2.push({
                    label: 'Sisa',
                    value: `Rp ${parseInt(jsonHeader.SISA).toLocaleString()}`
                });
            } else if (parseInt(jsonHeader.SISA) < 0) {
                dataGrid2.push({
                    label: 'Kembalian',
                    value: `Rp ${Math.abs(parseInt(jsonHeader.SISA)).toLocaleString()}`
                });
            }

            // Mendefinisikan posisi X untuk label dan value
            const labelXPosition2 = 140; // Posisi X untuk label
            const valueXPosition2 = 170; // Posisi X untuk nilai
            const lineHeight = 5; // Jarak antar baris

            // Loop untuk mencetak setiap baris
            dataGrid2.forEach((item, index) => {
                const yPosition = finalY + index * lineHeight; // Menyesuaikan Y untuk setiap baris
                doc.text(item.label.toString(), labelXPosition2, yPosition); // Cetak label
                doc.text(' : ', labelXPosition2 + 25, yPosition); // Cetak tanda titik dua
                doc.text(item.value.toString(), valueXPosition2, yPosition); // Cetak nilai
            });

            const pdfDataUrl = doc.output('datauristring');
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
            setShowPreview(false);
        } catch (error) {
            return console.log(error);
        }
    };

    const hidePDF = async () => {
        setjsPdfPreviewOpen(false);
        // await setLastFaktur('BK');
        router.push('/plugin/services/pembayaran');
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>{isUpdateMode ? 'Edit' : 'Add'} Pembayaran Tanpa Nota</h4>
                    <hr></hr>
                    <Toast ref={toast}></Toast>
                    <div>
                        <div className="formgrid grid">
                            <div className="field col-4 mb-2 lg:col-4">
                                <label htmlFor="faktur">Faktur</label>
                                <div className="p-inputgroup">
                                    <InputText id="faktur" value={faktur} readOnly></InputText>
                                </div>
                            </div>
                            <div className="field col-4 mb-2 lg:col-4">
                                <label htmlFor="tanggal">Tanggal</label>
                                <div className="p-inputgroup">
                                    <Calendar id="tgl" value={pembayaran.TGL && pembayaran.TGL ? new Date(pembayaran.TGL) : new Date()} onChange={(e) => onInputChange(e, 'Tgl')} showIcon dateFormat="dd-mm-yy" />
                                </div>
                            </div>
                            <div className="field col-4 mb-2 lg:col-4">
                                <label htmlFor="tglBayar">Tanggal Bayar</label>
                                <div className="p-inputgroup">
                                    <Calendar id="tglBayar" value={pembayaran.TGLBAYAR && pembayaran.TGLBAYAR ? new Date(pembayaran.TGLBAYAR) : new Date()} onChange={(e) => onInputChange(e, 'tglBayar')} showIcon dateFormat="dd-mm-yy" />
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-6">
                                <label htmlFor="customer">Customer</label>
                                <div className="p-inputgroup">
                                    <InputText id="customer" value={pembayaran.CUSTOMER} onChange={(e) => onInputChange(e, 'Customer')}></InputText>
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-6">
                                <label htmlFor="noTelepon">No. Telepon</label>
                                <div className="p-inputgroup">
                                    <InputText id="noTelepon" value={pembayaran.NOTELEPON} onChange={(e) => onInputChange(e, 'NoTelepon')}></InputText>
                                </div>
                            </div>
                            <div className="field col-2 mb-2 lg:col-2">
                                <label htmlFor="totalHarga">Sub Total</label>
                                <div className="p-inputgroup">
                                    <InputNumber value={totalHarga ?? 0} inputStyle={{ textAlign: 'right' }} readOnly></InputNumber>
                                </div>
                            </div>
                            <div className="field col-2 mb-2 lg:col-2">
                                <label htmlFor="ppn">PPn</label>
                                <div className="p-inputgroup">
                                    <InputNumber value={PPn ?? 0} inputStyle={{ textAlign: 'right' }} readOnly></InputNumber>
                                </div>
                            </div>
                            <div className="field col-2 mb-2 lg:col-2">
                                <label htmlFor="totalHarga">Total Harga</label>
                                <div className="p-inputgroup">
                                    <InputNumber value={totalHargaDanPPN ?? 0} inputStyle={{ textAlign: 'right' }} readOnly></InputNumber>
                                </div>
                            </div>
                            <div className="field col-3 mb-2 lg:col-3">
                                <label htmlFor="nominalBayar">Nominal Bayar</label>
                                <div className="p-inputgroup">
                                    <InputNumber value={pembayaran.NOMINALBAYAR ?? 0} inputStyle={{ textAlign: 'right' }} onChange={(e) => onInputNumberChange(e, 'NominalBayar')}></InputNumber>
                                </div>
                            </div>
                            <div className="field col-3 mb-2 lg:col-3">
                                <label htmlFor="sisa">Sisa</label>
                                <div className="p-inputgroup">
                                    <InputNumber value={sisa ?? 0} inputStyle={{ textAlign: 'right' }} onChange={(e) => onInputNumberChange(e, 'Sisa')}></InputNumber>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>{<PilihJasaBarang barangList={barangList} setBarangList={setBarangList} servicesAndStock={servicesAndStock} errors={errors} />}</div>
                    <br></br>
                    <Toolbar className="mb-4" right={rightFooterTemplate}></Toolbar>
                </div>
            </div>
            <Dialog
                visible={showPreview}
                onHide={hidePreview}
                header="Report Type" // Ini adalah judul dialog
                style={{ width: '90%' }}
            >
                <div className="card">
                    <div class="grid">
                        <div class="col-12 md:col-9 lg:col-9">
                            <div className="card">
                                <div class="grid">
                                    <div class="col-12 md:col-4 lg:col-4">
                                        <label htmlFor="rekening">Margin Atas</label>
                                        <div className="p-inputgroup" style={{ 'margin-top': '5px' }}>
                                            <InputText id="marginTop" value={marginTop} onChange={(e) => setMarginTop(e.target.value)} type="number" min="0" step="0.1" />
                                            <span className="p-inputgroup-addon">mm</span>
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-4 lg:col-4">
                                        <label htmlFor="rekening">Margin Bawah</label>
                                        <div className="p-inputgroup" style={{ 'margin-top': '5px' }}>
                                            <InputText id="marginBottom" value={marginBottom} onChange={(e) => setMarginBottom(e.target.value)} type="number" min="0" step="0.1" />
                                            <span className="p-inputgroup-addon">mm</span>
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-4 lg:col-4">
                                        <label htmlFor="rekening">Lebar Tabel</label>
                                        <div className="p-inputgroup" style={{ 'margin-top': '5px' }}>
                                            <InputText id="tableWidth" value={tableWidth} onChange={(e) => setTableWidth(e.target.value)} type="number" min="0" step="0.1" />
                                            <span className="p-inputgroup-addon">mm</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="grid">
                                    <div class="col-12 md:col-4 lg:col-4">
                                        <label htmlFor="rekening">Margin Kanan</label>
                                        <div className="p-inputgroup" style={{ 'margin-top': '5px' }}>
                                            <InputText id="marginRight" value={marginRight} onChange={(e) => setMarginRight(e.target.value)} type="number" min="0" step="0.1" />
                                            <span className="p-inputgroup-addon">mm</span>
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-4 lg:col-4">
                                        <label htmlFor="rekening">Margin Kiri</label>
                                        <div className="p-inputgroup" style={{ 'margin-top': '5px' }}>
                                            <InputText id="marginLeft" value={marginLeft} onChange={(e) => setMarginLeft(e.target.value)} type="number" min="0" step="0.1" />
                                            <span className="p-inputgroup-addon">mm</span>
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-4 lg:col-4">&nbsp;</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 md:col-3 lg:col-3">
                            <div className="card">
                                <div class="grid">
                                    <div class="col-12 md:col-12 lg:col-12">
                                        <label htmlFor="rekening">Ukuran Kertas</label>
                                        <div className="p-inputgroup" style={{ 'margin-top': '5px' }}>
                                            <Dropdown id="paperSize" value={selectedPaperSize} options={paperSizes} onChange={handlePaperSizeChange} optionLabel="name" />
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-12 lg:col-12">
                                        <label htmlFor="rekening">Orientasi</label>
                                        <div className="p-inputgroup" style={{ 'margin-top': '5px' }}>
                                            <Dropdown id="orientation" value={orientation} options={orientationOptions} onChange={handleOrientationChange} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card" style={{ backgroundColor: '#fAfAfA' }}>
                    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                        <div className="flex flex-row" style={{ justifyContent: 'flex-start' }}></div>
                        <div className="flex flex-row md:justify-between md:align-items-center">
                            <div className="flex flex-row" style={{ justifyContent: 'flex-start' }}>
                                <Button label="Export PDF" icon="pi pi-file" className="p-button-danger mr-2" onClick={cetakSlip} />
                            </div>
                        </div>
                    </div>
                </div>
            </Dialog>
            <Dialog visible={jsPdfPreviewOpen} onHide={hidePDF} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                <div className="p-dialog-content">
                    <PDFViewer pdfUrl={pdfUrl} />
                </div>
            </Dialog>
        </div>
    );
}

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
 * Created on Sun Sep 15 2024 - 02:07:39
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { classNames } from 'primereact/utils';
import { Calendar } from 'primereact/calendar';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { useRouter } from 'next/router';
import { Dialog } from 'primereact/dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Toolbar } from 'primereact/toolbar';
import postData from '../../../lib/Axios';
import NotaService from '../../../component/plugin/services/notaService';
import { formatDatePdf, getDBConfig, getEmail, getUserName } from '../../../component/plugin/services/GeneralFunction/GeneralFunction';
import PDFViewer from '../../../component/plugin/services/PDFViewer';
import { getSessionServerSide } from '../../../utilities/servertool';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function PembayaranDenganNota() {
    const router = useRouter();
    const toast = useRef(null);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [faktur, setFaktur] = useState(null);
    const [selectedNotaService, setSelectedNotaService] = useState(null);
    const [notaServiceOptions, setNotaServiceOptions] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [barangList, setBarangList] = useState([]);
    const [readOnlyEdit, setReadOnlyEdit] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pembayaran, setPembayaran] = useState({});
    const [pembayaranDetail, setPembayaranDetail] = useState([]);
    const [notaServiceDialog, setNotaServiceDialog] = useState(false);
    const [notaService, setNotaService] = useState('');
    const [totalHarga, setTotalHarga] = useState(0);
    const [PPn, setPPn] = useState(0);
    const [sisa, setSisa] = useState(0);
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
    const apiEndPointGetDataByNotaService = '/api/service/nota/get/data';
    const apiEndPointStore = '/api/pembayaran/nota/store';
    const apiEndPointGetDataFromFaktur = '/api/pembayaran/nota/get/data';

    const onPage = (event) => {
        setlazyState(event);
    };

    useEffect(() => {
        const { status } = router.query;
        const FAKTUR = localStorage.getItem('FAKTUR');
        if (status === 'update') {
            setFaktur(FAKTUR);
            fetchDataForEdit();
            setReadOnlyEdit(true);
            setIsUpdateMode(true);
        } else {
            loadLazyData();
            setIsUpdateMode(false);
        }
    }, [router.query]);

    const loadLazyData = async () => {
        try {
            let requestBody = {
                Kode: 'PSV',
                Len: 6
            };
            const vaData = await postData(apiEndPointGetFaktur, requestBody);
            const json = vaData.data;
            setFaktur(json);
            setPembayaran((prevPembayaran) => ({
                ...prevPembayaran,
                FAKTUR: json
            }));
        } catch (error) {
            console.error('Error while loading data:', error);
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
            const vaData = await postData(apiEndPointGetDataFromFaktur, requestBody);
            const json = vaData.data;

            // Set relevant state from the response data
            setPembayaran(json);
            setTotalHarga(json.TOTALHARGA);
            setPPn(json.PPN);
            setSisa(json.SISA);

            // Flatten the barangList to extract the services
            const flattenData = (barangList) => {
                return barangList.reduce((acc, item) => {
                    item.services.forEach((service) => {
                        acc.push({
                            Kode: item.Kode,
                            NamaBarang: item.NamaBarang,
                            Keterangan: item.Keterangan,
                            KodePenanganan: service.KodePenanganan,
                            Penanganan: service.Penanganan,
                            Qty: service.Qty,
                            Harga: service.Harga,
                            Total: service.Total
                        });
                    });
                    return acc;
                }, []);
            };

            // Check if barangList exists in the response
            if (json.barangList && Array.isArray(json.barangList)) {
                const flattenedPembayaranDetail = flattenData(json.barangList);
                setPembayaranDetail(flattenedPembayaranDetail);
                console.log(flattenedPembayaranDetail);
            } else {
                console.log('barangList is missing or not an array');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _data = { ...pembayaran };
        _data[`${name}`] = val;
        setPembayaran(_data);
        // console.log(_data);
        if (name === 'TGL' && val === '') {
            const today = new Date();
            // const formattedDate = formatDate(today);
            const formattedDate = today;
            let _retur = { ...pembayaran };
            dateFields.forEach((field) => {
                _retur[field] = formattedDate;
                setPembayaran(_retur);
            });
            setKeteranganTgl(formattedDate);
        }
    };

    const btnNotaService = () => {
        setNotaServiceDialog(true);
    };

    const handleNotaServiceData = (notaService) => {
        setNotaService(notaService);
        onRowSelectNotaService(notaService);
    };

    const onRowSelectNotaService = async (notaService) => {
        let requestBody = {
            Faktur: notaService
        };

        let persPPn = await getDBConfig('msPPN');

        try {
            setLoading(true);
            const vaData = await postData(apiEndPointGetDataByNotaService, requestBody);
            const json = vaData.data;
            setPembayaran(json);

            const pembayaranDetail = json.barangList;
            let _data = [...pembayaranDetail];
            if (_data && Array.isArray(_data)) {
                setPembayaranDetail(() => {
                    const updatedAddItem = _data.flatMap((data, index) => {
                        return data.services.map((service, serviceIndex) => ({
                            Kode: data.KODE,
                            NamaBarang: data.NAMA,
                            Keterangan: data.KETERANGAN,
                            KodePenanganan: service.KODE,
                            Penanganan: service.NAMA,
                            Qty: service.QTY,
                            Harga: service.HARGA,
                            Total: service.TOTAL
                        }));
                    });

                    const totalHargaKeseluruhan = updatedAddItem.reduce((acc, item) => acc + parseFloat(item.Total || 0), 0);
                    const dp = pembayaran?.DP ? parseFloat(pembayaran.DP) : 0;
                    const totalHargaKeseluruhanFloat = isNaN(totalHargaKeseluruhan) ? 0 : parseFloat(totalHargaKeseluruhan);
                    const ppn = isNaN(persPPn) ? 0 : parseFloat(persPPn);
                    const totalSetelahPPn = totalHargaKeseluruhanFloat + (totalHargaKeseluruhanFloat * ppn) / 100 - dp;
                    setTotalHarga(totalHargaKeseluruhan);
                    setPPn((totalHargaKeseluruhanFloat * ppn) / 100);
                    setSisa(totalSetelahPPn);
                    return updatedAddItem;
                });
            } else {
                setPembayaranDetail([]);
            }
        } catch (error) {
            console.error(error);
        }

        setLoading(false);
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

    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        let updatedPembayaran = { ...pembayaran, [name.toUpperCase()]: val };
        if (name === 'NominalBayar') {
            const uangMuka = parseInt(updatedPembayaran.DP) || 0;
            const NominalBayar = parseInt(val);
            setSisa(parseInt(totalHarga) + parseInt(PPn) - (uangMuka + NominalBayar));
        }

        setPembayaran(updatedPembayaran);
    };

    const onQtyUpdate = (updatedAddPembelian) => {
        setPembayaranDetail(updatedAddPembelian);
    };

    const onCellEditComplete = async (e) => {
        let { rowData, newValue, field } = e;

        let updatedAddPembayaran;
        let persPPn = await getDBConfig('msPPN');

        switch (field) {
            case 'Qty':
                const editedQty = parseFloat(newValue);

                // Ensure the new value is a valid number
                if (!isNaN(editedQty)) {
                    updatedAddPembayaran = pembayaranDetail.map((item) => {
                        if (item.Kode === rowData.Kode && item.KodePenanganan === rowData.KodePenanganan) {
                            // Recalculate the total based on the new Qty and existing Harga
                            const updatedData = calculateQtyAndTotal(item, editedQty, item.Harga, 'editQTYFromTable');

                            return {
                                ...item,
                                Qty: updatedData.updatedQty,
                                Total: updatedData.total
                            };
                        } else {
                            return item;
                        }
                    });

                    setPembayaranDetail(updatedAddPembayaran);
                } else {
                    console.log('Invalid input. Please enter a valid number for QTY.');
                }
                break;

            case 'Harga':
                const editedHarga = parseFloat(newValue);

                // Ensure the new value is a valid number
                if (!isNaN(editedHarga)) {
                    updatedAddPembayaran = pembayaranDetail.map((item) => {
                        if (item.Kode === rowData.Kode && item.KodePenanganan === rowData.KodePenanganan) {
                            // Recalculate the total based on the new Harga and existing Qty
                            const updatedData = calculateQtyAndTotal(item, item.Qty, editedHarga, 'editHargaFromTable');

                            return {
                                ...item,
                                Harga: updatedData.updatedHarga,
                                Total: updatedData.total
                            };
                        } else {
                            return item;
                        }
                    });

                    setPembayaranDetail(updatedAddPembayaran);
                } else {
                    console.log('Invalid input. Please enter a valid number for Harga.');
                }
                break;

            default:
                break;
        }

        // Recalculate totalHarga
        if (updatedAddPembayaran) {
            const totalHarga = updatedAddPembayaran.reduce((acc, item) => acc + parseFloat(item.Total || 0), 0);
            setTotalHarga(totalHarga);
            setPPn((totalHarga * persPPn) / 100);
            setSisa(totalHarga + (parseInt(totalHarga) * persPPn) / 100 - pembayaran.DP);
            // Optionally, call the parent function to update if necessary
            if (onQtyUpdate) {
                onQtyUpdate(updatedAddPembayaran);
            }
        }
    };

    const calculateQtyAndTotal = (addedData, editedQty, editedHarga, ketAsal) => {
        let updatedQty = editedQty || addedData.Qty;
        let updatedHarga = editedHarga || addedData.Harga;
        let total = 0;

        // Calculate total based on the new Qty and Harga
        total = updatedHarga * updatedQty;

        return {
            updatedQty,
            updatedHarga,
            total
        };
    };

    const cellEditor = (options) => {
        return <InputNumber value={options.value} onValueChange={(e) => options.editorCallback(e.value)} />;
    };

    const textEditor = (options) => {
        return <InputText type="text" value={options.value} onChange={(e) => options.editorCallback(e.target.value)} />;
    };

    const convertUndefinedToNull = (obj) => {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    convertUndefinedToNull(obj[key]); // Memanggil fungsi rekursif jika nilai properti adalah objek
                } else if (obj[key] === undefined) {
                    obj[key] = null; // Mengubah nilai undefined menjadi null
                }
            }
        }
    };

    const createDataObject = (_pembayaran, _pembayaranDetail) => {
        const data = {
            FAKTUR: faktur,
            KODE: _pembayaran.KODE,
            TGLBAYAR: _pembayaran.TGLPEMBAYARAN ?? _pembayaran.TGLBAYAR,
            HARGA: totalHarga,
            PPN: PPn,
            NOMINALBAYAR: _pembayaran.NOMINALBAYAR,
            detail: _pembayaranDetail
                .map((item) => {
                    return {
                        KODEBARANG: item.Kode ?? null,
                        KODEPENANGANAN: item.KodePenanganan ?? null,
                        QTY: item.Qty ?? null,
                        HARGA: item.Harga ?? null
                    };
                })
                .filter((item) => item !== null)
        };
        convertUndefinedToNull(data);
        return data;
    };

    const saveData = async (e) => {
        e.preventDefault();
        let _pembayaran = { ...pembayaran };
        let _pembayaranDetail = [...pembayaranDetail];
        let _data = createDataObject(_pembayaran, _pembayaranDetail);

        if (_data.KODE == '' || _data.KODE == null) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Nota Service Masih Kosong!', life: 3000 });
            return;
        }

        if (_data.NOMINALBAYAR == 0 || _data.NOMINALBAYAR == '') {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Nominal Bayar Masih Kosong!', life: 3000 });
            return;
        }

        // if (parseInt(_data.NOMINALBAYAR) > parseInt(pembayaran.SISA) && parseInt(pembayaran.SISA) != 0) {
        //     toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Nominal Bayar Melebihi Sisa!', life: 3000 });
        //     return;
        // }

        // if (parseInt(pembayaran.SISA) > parseInt(_data.NOMINALBAYAR && parseInt(pembayaran.SISA) != 0)) {
        //     toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Nominal Bayar Kurang Dari Sisa!', life: 3000 });
        //     return;
        // }

        if (_data.detail.length <= 0) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong!', life: 3000 });
            return;
        }
        const vaData = await postData(apiEndPointStore, _data);
        const json = vaData.data;
        if (json.code === '200') {
            toast.current.show({ severity: 'success', summary: json.message, detail: 'Data Berhasil Tersimpan', life: 3000 });
            setShowPreview(true);
        } else {
            toast.current.show({ severity: 'error', summary: json.message, detail: json.messageValidator, life: 3000 });
        }
    };

    const hidePreview = async () => {
        try {
            setShowPreview(false);
            router.push('/plugin/services/pembayaran');
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
            const vaTable = await postData(apiEndPointGetDataFromFaktur, requestBody);
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
                    const showItemDetails = previousItem !== item.Kode;
                    previousItem = item.Kode; // Set item saat ini sebagai previousItem untuk pengecekan berikutnya

                    return [
                        showItemDetails ? item.NamaBarang : '', // Tampilkan nama barang hanya jika item baru
                        showItemDetails ? item.Keterangan : '', // Tampilkan keterangan hanya jika item baru
                        service.Penanganan, // Tampilkan estimasi harga hanya jika item baru
                        parseFloat(service.Qty).toLocaleString(), // QTY dari services
                        parseFloat(service.Harga).toLocaleString(), // Harga dari services
                        parseFloat(service.Total).toLocaleString() // Total harga dari services
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
                    label2: 'No. Servis',
                    value2: jsonHeader.KODE
                },
                {
                    label: 'Tanggal Pembayaran',
                    value: formatDatePdf(jsonHeader.TGLPEMBAYARAN),
                    label2: 'Tanggal Servis',
                    value2: formatDatePdf(jsonHeader.TGLSERVIS)
                },
                {
                    label: 'Customer',
                    value: jsonHeader.PEMILIK,
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
        router.push('/plugin/services/pembayaran');
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>{isUpdateMode ? 'Edit' : 'Add'} Pembayaran Dengan Nota</h4>
                    <hr></hr>
                    <Toast ref={toast}></Toast>
                    <div>
                        <div className="formgrid grid">
                            <div className="field col-4 mb-2 lg:col-4">
                                <label htmlFor="faktur">Faktur</label>
                                <div className="p-inputgroup">
                                    <InputText id="faktur" value={faktur} readOnly />
                                </div>
                            </div>
                            <div className="field col-4 mb-2 lg:col-4">
                                <label htmlFor="faktur">Nota Servis</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly value={pembayaran.KODE} placeholder="Pilih Nota Servis" />
                                    <Button icon="pi pi-search" className="p-button" onClick={btnNotaService} disabled={readOnlyEdit} />
                                </div>
                            </div>
                            <div className="field col-4 mb-2 lg:col-4">
                                <label htmlFor="tanggal">Pemilik</label>
                                <div className="p-inputgroup">
                                    <InputText id="pemilik" value={pembayaran.PEMILIK} readOnly />
                                </div>
                            </div>
                            <div className="field col-4 mb-2 lg:col-4">
                                <label htmlFor="tanggalservis">Tanggal Servis</label>
                                <div className="p-inputgroup">
                                    <Calendar id="tglservis" value={pembayaran.TGLSERVIS && pembayaran.TGLSERVIS ? new Date(pembayaran.TGLSERVIS) : new Date()} onChange={(e) => onInputChange(e, 'TGLSERVIS')} showIcon dateFormat="dd-mm-yy" />
                                </div>
                            </div>
                            <div className="field col-4 mb-2 lg:col-4">
                                <label htmlFor="tanggalpembayaran">Tanggal Pembayaran</label>
                                <div className="p-inputgroup">
                                    <Calendar
                                        id="tglpembayaran"
                                        value={pembayaran.TGLPEMBAYARAN && pembayaran.TGLPEMBAYARAN ? new Date(pembayaran.TGLPEMBAYARAN) : new Date()}
                                        onChange={(e) => onInputChange(e, 'TGLPEMBAYARAN')}
                                        showIcon
                                        dateFormat="dd-mm-yy"
                                    />
                                </div>
                            </div>
                            <div className="field col-4 mb-2 lg:col-4">
                                <label htmlFor="tanggalservis">Estimasi Harga dan PPn</label>
                                <div className="p-inputgroup">
                                    <InputNumber value={pembayaran.TOTALBERSIH ?? 0} inputStyle={{ textAlign: 'right' }} readOnly></InputNumber>
                                </div>
                            </div>
                            <div className="field col-2 mb-2 lg:col-2">
                                <label htmlFor="tanggalservis">Total Harga</label>
                                <div className="p-inputgroup">
                                    <InputNumber value={totalHarga ?? 0} inputStyle={{ textAlign: 'right' }} readOnly></InputNumber>
                                </div>
                            </div>
                            <div className="field col-2 mb-2 lg:col-2">
                                <label htmlFor="tanggalservis">PPn</label>
                                <div className="p-inputgroup">
                                    <InputNumber value={PPn ?? 0} inputStyle={{ textAlign: 'right' }} readOnly></InputNumber>
                                </div>
                            </div>
                            <div className="field col-2 mb-2 lg:col-2">
                                <label htmlFor="tanggalpembayaran">Uang Muka</label>
                                <div className="p-inputgroup">
                                    <InputNumber value={pembayaran.DP ?? 0} inputStyle={{ textAlign: 'right' }} readOnly></InputNumber>
                                </div>
                            </div>
                            <div className="field col-3 mb-2 lg:col-3">
                                <label htmlFor="tanggalservis">Nominal Bayar</label>
                                <div className="p-inputgroup">
                                    <InputNumber value={pembayaran.NOMINALBAYAR ?? 0} inputStyle={{ textAlign: 'right' }} onChange={(e) => onInputNumberChange(e, 'NominalBayar')}></InputNumber>
                                </div>
                            </div>
                            <div className="field col-3 mb-2 lg:col-3">
                                <label htmlFor="tanggalpembayaran">Sisa</label>
                                <div className="p-inputgroup">
                                    <InputNumber value={sisa ?? 0} inputStyle={{ textAlign: 'right' }} onChange={(e) => onInputNumberChange(e, 'Sisa')}></InputNumber>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <DataTable
                            value={pembayaranDetail}
                            lazy
                            dataKey="KODE_TOKO"
                            // paginator
                            rows={10}
                            className="datatable-responsive"
                            first={lazyState.first}
                            onPage={onPage}
                            loading={loading}
                            size="small"
                        >
                            <Column headerStyle={{ textAlign: 'center' }} field="Kode" header="KODE"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="NamaBarang" header="NAMA BARANG"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="Keterangan" header="KETERANGAN"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="KodePenanganan" header="KODE PENANGANAN/KODE STOCK"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="Penanganan" header="PENANGANAN/STOCK"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="Qty" editor={(options) => cellEditor(options)} onCellEditComplete={onCellEditComplete} header="QTY"></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="Harga"
                                body={(rowData) => {
                                    const value = rowData.Harga ? parseInt(rowData.Harga).toLocaleString() : '0';
                                    return value;
                                }}
                                editor={(options) => cellEditor(options)}
                                onCellEditComplete={onCellEditComplete}
                                header="HARGA"
                            ></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="Total"
                                body={(rowData) => {
                                    const value = rowData.Total ? parseInt(rowData.Total).toLocaleString() : '0';
                                    return value;
                                }}
                                header="TOTAL"
                            ></Column>
                        </DataTable>
                    </div>
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
            <NotaService notaServiceDialog={notaServiceDialog} setNotaServiceDialog={setNotaServiceDialog} btnNotaService={btnNotaService} handleNotaServiceData={handleNotaServiceData}></NotaService>
        </div>
    );
}

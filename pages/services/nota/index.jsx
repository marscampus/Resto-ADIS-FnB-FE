'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { TabView, TabPanel } from 'primereact/tabview';
import { Dialog } from 'primereact/dialog';
import { Toolbar } from 'primereact/toolbar';
import React from 'react';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import jsPDF from 'jspdf';
import { startOfMonth } from 'date-fns';
import { convertToISODate, formatCurrency, formatDate, formatDatePdf, formatDateTable, getDBConfig, getEmail, getUserName } from '../../../component/GeneralFunction/GeneralFunction';
import PDFViewer from '../../../component/PDFViewer';
import { addPageInfo, Footer, HeaderLaporan } from '../../../component/exportPDF/exportPDF';
import { exportToXLSX } from '../../../component/exportXLSX/exportXLSX';
import AdjustPrintMarginLaporan from '../../component/adjustPrintMarginLaporan';
import { getSessionServerSide } from '../../../utilities/servertool';
import postData from '../../../lib/Axios';
import PilihJasaBarang from '../../../component/plugin/services/pilihJasaBarang';
export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    // const userPlugin = await checkUserHadPlugins(sessionData.user.email, 'services');
    // if (userPlugin?.redirect) {
    //     return userPlugin;
    // }
    return {
        props: {}
    };
}
const NotaServicePage = () => {
    const [notaServices, setNotaServices] = useState([]);
    const [notaServicesFilt, setNotaServicesFilt] = useState([]);
    const [search, setSearch] = useState('');
    const [nota, setNota] = useState({
        STATUS: 0,
        FAKTUR: '',
        KODE: 'Loading...',
        TGL: new Date().toISOString().split('T')[0],
        TGLBAYAR: new Date().toISOString().split('T')[0],
        PEMILIK: '',
        NOTELEPON: '',
        ESTIMASISELESAI: new Date().toISOString().split('T')[0],
        ESTIMASIHARGA: 0,
        HARGA: 0,
        NOMINALBAYAR: 0,
        DP: 0,
        PENERIMA: '',
        ANTRIAN: 0
    });

    const apiEndPointGet = '/api/service/nota/data';
    const apiEndPointGetService = '/api/service/stock/data';
    const apiEndPointGetFaktur = '/api/get_faktur';
    const apiEndPointStore = '/api/service/nota/store';
    const apiEndPointUpd = '/api/service/nota/update';
    const apiEndPointDelete = '/api/service/nota/delete';
    const apiEndPointGetDataFaktur = '/api/service/nota/get/data';

    const [services, setServices] = useState([]);
    const [faktur, setFaktur] = useState(null);
    const [barangList, setBarangList] = useState([{ KODE: '', NAMA: '', KETERANGAN: '', STATUSAMBIL: 'Antrian', services: [], ESTIMASIHARGA: 0 }]);
    const [notaServiceDialog, setNotaServiceDialog] = useState(false);
    const [deleteNotaServiceDialog, setDeleteNotaServiceDialog] = useState(false);
    const [deleteNotaServicesDialog, setDeleteNotaServicesDialog] = useState(false);
    const [selectedNotaServices, setSelectedNotaServices] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [dataLoaded, setDataLoaded] = useState(false);
    const toast = useRef(null);
    const dt = useRef(null);
    const [isNewRecord, setIsNewRecord] = useState(true);
    const [errors, setErrors] = useState({});
    const [servicesAndStock, setServicesAndStock] = useState([]);
    const [showInvoice, setShowInvoice] = useState(false);
    const [invoiceNotaService, setInvoiceNotaService] = useState(null);
    const [totalRecords, setTotalRecords] = useState(0);
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [startDate, setStartDate] = useState(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState(new Date());
    const [defaultOption, setDropdownValue] = useState(null);
    useEffect(() => {
        fetchServicesAndStock();
        loadNotaServices();
    }, []);

    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
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

    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    useEffect(() => {
        setNotaServicesFilt(notaServices);
    }, [notaServices, lazyState]);

    const onPage = (event) => {
        setlazyState(event);
        setFirst(event.first); // Mengatur halaman saat halaman berubah
        setRows(event.rows); // Mengatur jumlah baris per halaman
    };

    const fetchServicesAndStock = async () => {
        try {
            // const data = await ServiceStockAPI.getAll();
            const data = await postData(apiEndPointGetService, lazyState);
            setServicesAndStock(data.data);
            return console.log(data.data);
        } catch (error) {
            console.error('Error fetching services and stock:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Terjadi kesalahan saat memuat data jasa dan barang', life: 3000 });
        }
    };

    const refresh = () => {
        loadNotaServices();
    };

    const loadNotaServices = async () => {
        setLoading(true);
        try {
            let requestBody = { ...lazyState };
            if (startDate && endDate) {
                requestBody.START_DATE = convertToISODate(startDate);
                requestBody.END_DATE = convertToISODate(endDate);
            }
            const data = await postData(apiEndPointGet, requestBody);

            setNotaServices(data.data.data);
        } catch (error) {
            console.error('Error loading nota services:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Terjadi kesalahan saat memuat data nota service', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNota((prev) => ({ ...prev, [name]: value }));
    };

    const openNew = async () => {
        setNotaServiceDialog(true);
        try {
            let requestBody = {
                Kode: 'SV',
                Len: 6
            };
            const response = await postData(apiEndPointGetFaktur, requestBody);
            const json = response.data;
            setFaktur(json);
            setNota((prevNota) => ({
                ...prevNota,
                KODE: json
            }));
            setNota({
                STATUS: 0,
                FAKTUR: '',
                KODE: response.data,
                TGL: new Date().toISOString().split('T')[0],
                TGLBAYAR: new Date().toISOString().split('T')[0],
                PEMILIK: '',
                NOTELEPON: '',
                ESTIMASISELESAI: new Date().toISOString().split('T')[0],
                ESTIMASIHARGA: 0,
                HARGA: 0,
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
            setIsNewRecord(true);
        } catch (error) {
            console.error('Error getting new identifiers:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Terjadi kesalahan saat membuat nota service baru', life: 3000 });
        }
    };
    const hideDialog = () => {
        setNotaServiceDialog(false);
    };
    const hideDeleteNotaServiceDialog = () => {
        setDeleteNotaServiceDialog(false);
    };
    const hideDeleteNotaServicesDialog = () => {
        setDeleteNotaServicesDialog(false);
    };
    const getErrorMessage = (field) => {
        return errors[field] ? errors[field][0] : '';
    };
    const handleShowInvoice = async (rowData) => {
        setFaktur(rowData.KODE);
        setShowInvoice(true);
    };

    const saveNotaService1 = async () => {
        try {
            setErrors({});
            const dataToSave = {
                ...nota,
                barangList
            };
            let savedNotaService;
            if (isNewRecord) {
                savedNotaService = await NotaServiceAPI.create(dataToSave);
            } else {
                savedNotaService = await NotaServiceAPI.update(nota.KODE, dataToSave);
            }
            loadNotaServices();
            toast.current?.show({ severity: 'success', summary: 'Success', detail: `Berhasil ${isNewRecord ? 'menambahkan' : 'memperbarui'} Nota Service`, life: 3000 });
            const notaService = await NotaServiceAPI.getOne(savedNotaService.KODE);
            setInvoiceNotaService(notaService);
            setShowInvoice(true);
        } catch (error) {
            console.error('Error saving Nota Service:', error);
            if (error.errors) {
                setErrors(error.errors);
                toast.current?.show({ severity: 'error', summary: 'Tidak memenuhi validasi', detail: error.message || 'Mohon periksa kembali inputan anda', life: 3000 });
            } else {
                toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message || 'Terjadi kesalahan saat menyimpan Nota Service', life: 3000 });
            }
        }
    };

    const saveNotaService = async () => {
        setErrors({});
        const dataToSave = {
            ...nota,
            barangList
        };

        if (dataToSave.KODE == null || dataToSave.KODE == '') {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'No. Servis Masih Kosong!', life: 3000 });
            return;
        }

        if (dataToSave.PEMILIK == null || dataToSave.PEMILIK == '') {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Pemilik Masih Kosong!', life: 3000 });
            return;
        }

        if (dataToSave.NOTELEPON == null || dataToSave.NOTELEPON == '') {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'No. Telepon Masih Kosong!', life: 3000 });
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

        let response;
        try {
            let endPoint;
            if (isNewRecord) {
                endPoint = apiEndPointStore;
            } else {
                endPoint = apiEndPointUpd;
            }
            console.log(dataToSave);

            const vaData = await postData(endPoint, dataToSave);
            let data = vaData.data;
            if (data.code === '200') {
                setNotaServiceDialog(false);
                toast.current?.show({ severity: 'success', summary: 'Success', detail: `Berhasil ${isNewRecord ? 'menambahkan' : 'memperbarui'} Nota Service`, life: 3000 });
                setShowInvoice(true);
                loadNotaServices();
                // isNewRecord ? setNotaServiceDialog(false) : setShowInvoice(true);
            } else if (data.code === '409') {
                toast.current.show({ severity: 'error', summary: data.message, detail: 'Kode Tidak Boleh Sama', life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: data.message, detail: data.messageValidator, life: 3000 });
            }
        } catch (error) {
            console.error('Error saving service:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Terjadi kesalahan dalam menyimpan Nota Services', life: 3000 });
        }
    };

    const editNotaService1 = (notaService) => {
        setNota({ ...notaService });
        const updatedBarangList = notaService.barangList?.map((barang) => {
            const newEstimatedPrice = barang.services.reduce((sum, service) => sum + service.HARGA, 0);
            return { ...barang, ESTIMASIHARGA: newEstimatedPrice };
        });
        setBarangList(updatedBarangList || []);
        setNotaServiceDialog(true);
        setIsNewRecord(false);
    };

    const editNotaService = async (rowData) => {
        setNotaServiceDialog(true);
        setFaktur(rowData.KODE);
        let requestBody = {
            Faktur: rowData.KODE
        };
        const vaData = await postData(apiEndPointGetDataFaktur, requestBody);
        const json = vaData.data;
        setNota(json);
        setBarangList(json.barangList);
        setIsNewRecord(false);
    };

    const confirmDeleteNotaService = (notaService) => {
        setNota(notaService);
        setDeleteNotaServiceDialog(true);
    };

    const deleteNotaService = async () => {
        try {
            let requestBody = {
                Faktur: nota.KODE
            };
            const vaData = await postData(apiEndPointDelete, requestBody);
            let data = vaData.data;

            if (data.code === '200') {
                toast.current?.show({ severity: 'success', summary: 'Successful', detail: 'Berhasil menghapus Nota Service', life: 3000 });
                setDeleteNotaServiceDialog(false);
                loadNotaServices();
            }
        } catch (error) {
            console.error('Error deleting nota service:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Terjadi kesalahan saat menghapus Nota Service', life: 3000 });
        }
    };

    const exportCSV = () => {
        dt.current?.exportCSV();
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

            const judulLaporan = 'Nota Servis';
            const periodeLaporan = '';

            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            let previousItem = null;

            const tableData = jsonDetail.flatMap((item) =>
                item.services.map((service, index) => {
                    // Cek apakah item saat ini sama dengan item sebelumnya
                    const showItemDetails = previousItem !== item.KODE;
                    previousItem = item.KODE; // Set item saat ini sebagai previousItem untuk pengecekan berikutnya

                    return [
                        showItemDetails ? item.NAMA : '', // Tampilkan nama barang hanya jika item baru
                        showItemDetails ? item.KETERANGAN : '', // Tampilkan keterangan hanya jika item baru
                        showItemDetails ? parseFloat(item.ESTIMASIHARGA).toLocaleString() : '', // Tampilkan estimasi harga hanya jika item baru
                        service.NAMA, // Nama service/stock
                        parseFloat(service.QTY).toLocaleString(), // QTY dari services
                        parseFloat(service.HARGA).toLocaleString(), // Harga dari services
                        parseFloat(service.TOTAL).toLocaleString() // Total harga dari services
                    ];
                })
            );

            // tableData.push(['Total Items : ', '', parseInt(jsonHeader.ESTIMASIHARGA).toLocaleString()]);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const dataGrid = [
                {
                    label: 'No. Servis',
                    value: faktur,
                    label2: 'Tanggal',
                    value2: formatDatePdf(jsonHeader.TGL)
                },
                {
                    label: 'Customer',
                    value: jsonHeader.PEMILIK,
                    label2: 'No.Telepon',
                    value2: jsonHeader.NOTELEPON
                },
                {
                    label: 'Estimasi Selesai',
                    value: formatDatePdf(jsonHeader.ESTIMASISELESAI),
                    label2: '',
                    value2: ''
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
                head: [['BARANG', 'KETERANGAN', 'ESTIMASI HARGA', 'SERVICE/STOCK', 'QTY', 'HARGA', 'TOTAL']],
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
                    2: { halign: 'right' },
                    4: { halign: 'right' },
                    5: { halign: 'right' },
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

            const totalKeseluruhan = parseInt(jsonHeader.ESTIMASIHARGA).toLocaleString();
            const ppn = parseInt(jsonHeader.PPN).toLocaleString();
            const totalBersih = parseInt(jsonHeader.TOTALBERSIH).toLocaleString();
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
                }
            ];

            // Mendefinisikan posisi X untuk label dan value
            const labelXPosition2 = 140; // Posisi X untuk label
            const valueXPosition2 = 170; // Posisi X untuk nilai
            const lineHeight = 5; // Jarak antar baris

            // Loop untuk mencetak setiap baris
            dataGrid2.forEach((item, index) => {
                const yPosition = finalY + index * lineHeight; // Menyesuaikan Y untuk setiap baris
                doc.text(item.label.toString(), labelXPosition2, yPosition); // Cetak label
                doc.text(' : ', labelXPosition2 + 20, yPosition); // Cetak tanda titik dua
                doc.text(item.value.toString(), valueXPosition2, yPosition); // Cetak nilai
            });

            // doc.text('Subtotal', alignRightX - 40, finalY);
            // doc.text(`Rp ${totalKeseluruhan}`, alignRightX, finalY, { align: 'right' });
            // doc.text('PPN (11%)', alignRightX - 40, finalY + 5);
            // doc.text(`Rp ${ppn}`, alignRightX, finalY + 5, { align: 'right' });
            // doc.text('Total', alignRightX - 40, finalY + 10);
            // doc.text(`Rp ${totalBersih}`, alignRightX, finalY + 10, { align: 'right' });

            const pdfDataUrl = doc.output('datauristring');
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
            setShowInvoice(false);
        } catch (error) {
            return console.log(error);
        }
    };

    const confirmDeleteSelected = () => {
        setDeleteNotaServicesDialog(true);
    };

    const hidePreview = () => {
        try {
            setShowInvoice(false);
            loadNotaServices();
        } catch (error) {
            console.log(error);
        }
    };

    const deleteSelectedNotaServices = async () => {
        try {
            await NotaServiceAPI.bulkDelete(selectedNotaServices.map((ns) => ns.KODE));
            loadNotaServices();
            setDeleteNotaServicesDialog(false);
            setSelectedNotaServices([]);
            toast.current?.show({ severity: 'success', summary: 'Successful', detail: 'Berhasil menghapus nota service yang dipilih', life: 3000 });
        } catch (error) {
            console.error('Error deleting nota services:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Terjadi kesalahan saat menghapus nota service yang dipilih', life: 3000 });
        }
    };

    const updateTotalEstimasi = useCallback(() => {
        // Penjumlahan langsung dari field ESTIMASIHARGA di barangList
        const total = barangList.reduce((sum, barang) => {
            return sum + (barang.ESTIMASIHARGA || 0); // Tambahkan nilai ESTIMASIHARGA, pastikan ada fallback 0 jika undefined
        }, 0);

        // Set nilai ESTIMASIHARGA di nota
        setNota((prev) => ({ ...prev, ESTIMASIHARGA: total }));
    }, [barangList]);

    useEffect(() => {
        updateTotalEstimasi();
    }, [barangList, updateTotalEstimasi]);

    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <Button label="Tambah" icon="pi pi-plus" severity="success" className="mr-2" onClick={openNew} />
            </React.Fragment>
        );
    };

    const rightToolbarTemplate = () => {
        return (
            <React.Fragment>
                <Button label="Ekspor" icon="pi pi-upload" severity="help" onClick={exportCSV} />
            </React.Fragment>
        );
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-file-pdf" rounded severity="info" className="mr-2" onClick={() => handleShowInvoice(rowData)} />
                <Button icon="pi pi-pencil" rounded severity="success" className="mr-2" onClick={() => editNotaService(rowData)} />
                <Button icon="pi pi-trash" rounded severity="warning" onClick={() => confirmDeleteNotaService(rowData)} />
            </>
        );
    };

    const handleStartDateChange = (e) => {
        setStartDate(e.value);
    };
    const handleEndDateChange = (e) => {
        setEndDate(e.value);
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup">
                    <Calendar name="startDate" value={startDate} onChange={handleStartDateChange} placeholder="Start Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                    <Calendar name="endDate" value={endDate} onChange={handleEndDateChange} placeholder="End Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                    <Button label="" icon="pi pi-refresh" className="p-button-primary mr-2" onClick={refresh} />
                </div>
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText placeholder="Search" value={search} onChange={(e) => filterPlugins('search', e.target.value)} className="w-full" />
                </span>
            </div>
        </div>
    );

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = notaServices.filter((d) => (x ? x.test(d.KODE) || x.test(d.TGL) || x.test(d.ESTIMASISELESAI) || x.test(d.PEMILIK) || x.test(d.NOTELEPON) || x.test(d.ESTIMASIHARGA) : []));
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = notaServices;
            } else {
                filtered = notaServices.filter((d) => (x ? x.test(d.KODE) : []));
            }
        }
        console.log(filtered);

        setNotaServicesFilt(filtered);
    };

    const hidePDF = async () => {
        setjsPdfPreviewOpen(false);
        loadNotaServices();
    };

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (notaServices.length == 0 || !notaServices) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong', life: 3000 });
            return;
        }
        setAdjustDialog(true);
    };

    const handleAdjust = async (dataAdjust) => {
        exportPDF(dataAdjust);
    };

    const exportPDF = async (dataAdjust) => {
        try {
            const notaTabelPDF = notaServices ? JSON.parse(JSON.stringify(notaServices)) : [];
            let format = 'a4';
            if (selectedPaperSize === 'Letter') {
                format = 'letter';
            } else if (selectedPaperSize === 'Legal') {
                format = 'legal';
            }

            const marginLeftInMm = parseFloat(dataAdjust.marginLeft);
            const marginTopInMm = parseFloat(dataAdjust.marginTop);
            const marginRightInMm = parseFloat(dataAdjust.marginRight);
            const doc = new jsPDF({
                orientation,
                unit: 'mm',
                format,
                left: marginLeftInMm,
                right: marginRightInMm,
                putOnlyUsedFonts: true
            });

            if (!notaTabelPDF || notaTabelPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Laporan Nota Service';
            const periodeLaporan = 'Antara Tanggal ' + formatDate(startDate) + 's.d ' + formatDate(endDate);
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = notaTabelPDF.map((item) => [item.KODE, formatDate(item.TGL), formatDate(item.ESTIMASISELESAI), item.PEMILIK, item.NOTELEPON, parseInt(item.ESTIMASIHARGA).toLocaleString()]);
            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['NO.SERVIS.', 'TANGGAL', 'ESTIMASI SELESAI', 'PEMILIK', 'NO.TELEPON', 'ESTIMASI HARGA']],
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
                    1: { align: 'center' },
                    2: { align: 'center' },
                    5: { halign: 'right' }
                },
                headerStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                didDrawPage: (data) => {
                    addPageInfo(doc, userName, marginRightInMm);
                }
            });

            await Footer({ doc, marginLeftInMm, marginTopInMm, marginRightInMm });
            const pdfDataUrl = doc.output('datauristring');
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
            setShowPreview(false);
        } catch (error) {
            console.log(error);
        }
    };

    // Yang Handle Excel
    const exportExcel = () => {
        exportToXLSX(notaServices, 'laporan-nota-services.xlsx');
    };

    const preview = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Preview" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnAdjust} />
                </div>
            </React.Fragment>
        );
    };

    return (
        <div className="full-page">
            <div className="card">
                <h4>Nota Service</h4>
                <hr></hr>
                <Toast ref={toast} />
                <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>
                <DataTable
                    value={notaServicesFilt}
                    // globalFilter={globalFilter}
                    filters={lazyState.filters}
                    header={header}
                    first={first} // Menggunakan nilai halaman pertama dari state
                    rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                    onPage={onPage} // Memanggil fungsi onPage saat halaman berubah
                    paginator
                    paginatorTemplate={`FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown`}
                    currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                    totalRecords={totalRecords} // Total number of records
                    size="small"
                    loading={loading}
                    emptyMessage="Data Kosong"
                    onRowsPerPageChange={(e) => setRowsPerPage(e.value)}
                >
                    {/* <Column selectionMode="multiple" headerStyle={{ width: '4rem' }}></Column> */}
                    <Column field="KODE" header="NO. SERVIS"></Column>
                    <Column field="TGL" header="TANGGAL" body={(rowData) => <span>{formatDateTable(rowData.TGL)}</span>}></Column>
                    <Column field="ESTIMASISELESAI" header="ESTIMASI SELESAI" body={(rowData) => <span>{formatDateTable(rowData.ESTIMASISELESAI)}</span>}></Column>
                    <Column field="PEMILIK" header="PEMILIK"></Column>
                    <Column field="NOTELEPON" header="NO. TELEPON"></Column>
                    <Column field="ESTIMASIHARGA" header="ESTIMASI HARGA" body={(rowData) => formatCurrency(rowData.ESTIMASIHARGA)}></Column>
                    <Column field="barang_list" header="ANTRIAN" body={(rowData) => (rowData.barang_list && rowData.barang_list.length > 0 ? rowData.barang_list[0].STATUSAMBIL : 'Tidak ada data')}></Column>
                    <Column header="ACTION" body={actionBodyTemplate}></Column>
                </DataTable>
                <Toolbar className="mb-4" left={preview}></Toolbar>

                <Dialog
                    visible={notaServiceDialog}
                    style={{ width: '85%' }}
                    header="Detail Nota Service"
                    modal
                    className="p-fluid"
                    footer={
                        <div className="flex justify-content-end">
                            <Button label="Batal" icon="pi pi-times" text onClick={hideDialog} />
                            <Button label="Simpan" icon="pi pi-check" text onClick={saveNotaService} />
                        </div>
                    }
                    onHide={hideDialog}
                >
                    <TabView>
                        <TabPanel header="Data Klien">
                            <div className="p-fluid">
                                <div className="field">
                                    <label htmlFor="noServis">No. Servis</label>
                                    <InputText readOnly id="noServis" name="KODE" value={nota.KODE} onChange={handleInputChange} className={errors.KODE ? 'p-invalid' : ''} />
                                    {getErrorMessage('KODE') && <small className="p-error">{getErrorMessage('KODE')}</small>}
                                </div>
                                <div className="field">
                                    <label htmlFor="pemilik">Pemilik</label>
                                    <InputText id="pemilik" name="PEMILIK" value={nota.PEMILIK} onChange={handleInputChange} className={errors.PEMILIK ? 'p-invalid' : ''} />
                                    {getErrorMessage('PEMILIK') && <small className="p-error">{getErrorMessage('PEMILIK')}</small>}
                                </div>
                                <div className="field">
                                    <label htmlFor="noTelp">No. Telp</label>
                                    <InputText id="noTelp" name="NOTELEPON" value={nota.NOTELEPON} onChange={handleInputChange} className={errors.NOTELEPON ? 'p-invalid' : ''} />
                                    {getErrorMessage('NOTELEPON') && <small className="p-error">{getErrorMessage('NOTELEPON')}</small>}
                                </div>
                                <div className="field">
                                    <label htmlFor="tanggal">Tanggal</label>
                                    <Calendar id="tanggal" name="TGL" value={new Date(nota.TGL)} onChange={(e) => setNota((prev) => ({ ...prev, TGL: e.value ? e.value.toISOString().split('T')[0] : '' }))} dateFormat="dd-mm-yy" showIcon />
                                </div>
                            </div>
                        </TabPanel>
                        <TabPanel header="Pilih Jasa dan Barang">
                            <PilihJasaBarang barangList={barangList} setBarangList={setBarangList} servicesAndStock={servicesAndStock} errors={errors} />
                        </TabPanel>
                        <TabPanel header="Ringkasan">
                            <div className="p-fluid">
                                <div className="field">
                                    <label htmlFor="estimasiHarga">Estimasi Harga</label>
                                    <InputText id="estimasiHarga" value={formatCurrency(nota.ESTIMASIHARGA)} readOnly style={{ textAlign: 'right' }} />
                                </div>
                                <div className="field">
                                    <label htmlFor="estimasiSelesai">Estimasi Selesai</label>
                                    <Calendar
                                        id="estimasiSelesai"
                                        name="ESTIMASISELESAI"
                                        value={new Date(nota.ESTIMASISELESAI)}
                                        onChange={(e) => setNota((prev) => ({ ...prev, ESTIMASISELESAI: e.value ? e.value.toISOString().split('T')[0] : '' }))}
                                        dateFormat="dd-mm-yy"
                                        showIcon
                                    />
                                </div>
                                <div className="field">
                                    <label htmlFor="dp">DP</label>
                                    <InputNumber id="dp" name="DP" value={nota.DP} onValueChange={(e) => handleInputChange({ target: { name: 'DP', value: e.value || 0 } })} inputStyle={{ textAlign: 'right' }} />
                                </div>
                                <div className="field">
                                    <label htmlFor="penerima">Penerima</label>
                                    <InputText id="penerima" name="PENERIMA" value={nota.PENERIMA} onChange={handleInputChange} />
                                </div>
                            </div>
                        </TabPanel>
                    </TabView>
                </Dialog>

                <Dialog
                    visible={deleteNotaServiceDialog}
                    style={{ width: '450px' }}
                    header="Confirm"
                    modal
                    footer={
                        <div className="flex justify-content-end">
                            <Button label="Batal" icon="pi pi-times" text onClick={hideDeleteNotaServiceDialog} />
                            <Button label="Ya" icon="pi pi-check" text onClick={deleteNotaService} />
                        </div>
                    }
                    onHide={hideDeleteNotaServiceDialog}
                >
                    <div className="flex align-items-center justify-content-center">
                        <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                        {nota && <span>Apakah Anda yakin ingin menghapus nota service ini?</span>}
                    </div>
                </Dialog>

                <Dialog
                    visible={deleteNotaServicesDialog}
                    style={{ width: '450px' }}
                    header="Confirm"
                    modal
                    footer={
                        <div className="flex justify-content-end">
                            <Button label="Batal" icon="pi pi-times" text onClick={hideDeleteNotaServicesDialog} />
                            <Button label="Ya" icon="pi pi-check" text onClick={deleteSelectedNotaServices} />
                        </div>
                    }
                    onHide={hideDeleteNotaServicesDialog}
                >
                    <div className="flex align-items-center justify-content-center">
                        <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                        {nota && <span>Apakah Anda yakin ingin menghapus nota service yang dipilih?</span>}
                    </div>
                </Dialog>

                <Dialog
                    visible={showInvoice}
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
                                            <label htmlFor="rekening">Margin Atas </label>
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
            <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
            <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                <div className="p-dialog-content">
                    <PDFViewer pdfUrl={pdfUrl} />
                </div>
            </Dialog>
        </div>
    );
};
export default NotaServicePage;

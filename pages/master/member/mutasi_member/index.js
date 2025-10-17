import jsPDF from 'jspdf';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Row } from 'primereact/row';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { convertToISODate, formatColumnValue, formatDate, formatRibuan, getEmail, getUserName, showError } from '../../../../component/GeneralFunction/GeneralFunction';
import PDFViewer from '../../../../component/PDFViewer.js';
import { addPageInfo, Footer, HeaderLaporan } from '../../../../component/exportPDF/exportPDF.js';
import { BlockUI } from 'primereact/blockui';
import postData from '../../../../lib/Axios';
import { getSessionServerSide } from '../../../../utilities/servertool';
import { startOfMonth } from 'date-fns';
import AdjustPrintMarginLaporan from '../../../component/adjustPrintMarginLaporan.js';
import { exportToXLSX } from '../../../../component/exportXLSX/exportXLSX.js';
export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}
export default function MasterMutasiMember() {
    // API READ
    const apiEndPointGet = '/api/mutasi_member/get';
    const apiEndPointGetDataPrint = '/api/mutasi_member/print';

    const toast = useRef(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [mutasiMemberDialog, setMutasiMemberDialog] = useState(false);
    const [mutasiTabel, setMutasiTabel] = useState(null);
    const [mutasiTabelFilt, setMutasiTabelFilt] = useState(null);
    const [search, setSearch] = useState('');
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const fileName = `laporan-mutasi-member-${new Date().toISOString().slice(0, 10)}`;
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    // PDF
    // const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [marginTop, setMarginTop] = useState(10); // JSPDF
    const [marginLeft, setMarginLeft] = useState(10); // JSPDF
    const [marginRight, setMarginRight] = useState(10); // JSPDF

    const onPage = (event) => {
        // Set lazyState from event
        setlazyState(event);

        // Ensure filters remain as strings if they are objects
        if (event.filters) {
            Object.keys(event.filters).forEach((key) => {
                const filterValue = event.filters[key];
                if (typeof filterValue === 'object' && !Array.isArray(filterValue)) {
                    const stringValue = Object.values(filterValue).join('');
                    event.filters[key] = stringValue;
                }
            });
        }
        // Set first and rows for pagination
        setFirst(event.first);
        setRows(event.rows);

        // Load data with updated lazyState
        loadLazyData();
    };

    useEffect(() => {
        setMutasiTabelFilt(mutasiTabel);
    }, [mutasiTabel, lazyState]);

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    const [startDate, setStartDate] = useState(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState(new Date());
    const loadLazyData = async () => {
        try {
            setLoading(true);
            const requestBody = {
                TglAwal: convertToISODate(startDate),
                TglAkhir: convertToISODate(endDate)
            };
            const vaTable = await postData(apiEndPointGet, requestBody);
            setTotalRecords(vaTable.total_data);
            setMutasiTabel(vaTable.data.data);
        } catch (error) {
            let e = error?.response?.data || error;
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: e.message || 'Kesalahan Proses', life: 3000 });
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    const refresh = () => {
        setLoading(true);
        if (startDate && endDate) {
            const updatedLazyState = {
                ...lazyState,
                START_DATE: startDate,
                END_DATE: endDate
            };

            loadLazyData(updatedLazyState);
        } else {
            loadLazyData(lazyState);
        }
        setLoading(false);
    };
    const handleStartDateChange = (e) => {
        setStartDate(e.value);
    };
    const handleEndDateChange = (e) => {
        setEndDate(e.value);
    };
    // ----------------------------------------------------------------------------------------------------------------- Hide Dialog
    const hideDialog = () => {
        setSubmitted(false);
        setMutasiMemberDialog(false);
    };

    // -------------------------------------------------------------------------------------------------------------------- Func
    const headerSearch = (
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
            filtered = mutasiTabel.filter((d) =>
                x ? x.test(d.Faktur) || x.test(d.Member) || x.test(d.Nama) || x.test(d.Alamat) || x.test(d.PointDebet) || x.test(d.NominalPointDebet) || x.test(d.PointKredit) || x.test(d.NominalPointKredit) || x.test(d.Jumlah) : []
            );
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = mutasiTabel;
            } else {
                Faktur;
                filtered = mutasiTabel.filter((d) => (x ? x.test(d.Faktur) : []));
            }
        }

        setMutasiTabelFilt(filtered);
    };

    const [memberUsed, setMemberUsed] = useState([]);
    const [mutasiMemberUsed, setMutasiMemberUsed] = useState([]);
    const [adjustDialog, setAdjustDialog] = useState(false);

    const preview = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button
                        label="Preview"
                        icon="pi pi-file-o"
                        outlined
                        className="p-button-secondary p-button-sm mr-2"
                        onClick={() => {
                            setAdjustDialog(true);
                            setIsAllPreview(true);
                        }}
                    />
                </div>
            </React.Fragment>
        );
    };

    const [isAllPreview, setIsAllPreview] = useState(false);
    // -----------------------------------------------------------------------------------------------------------------< Member >
    const funcPilihMember = async (rowData) => {
        if (!rowData.Kode) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Member Masih Kosong!', life: 3000 });
            return;
        }
        setLoading(true);
        try {
            let requestBody = {
                Kode: rowData.Kode
            };
            const vaTable = await postData(apiEndPointGetDataPrint, requestBody);
            const json = vaTable.data.data;
            setMemberUsed(json);
            setMutasiMemberUsed(json.DataMutasi);
            setAdjustDialog(true);
        } catch (error) {
            let e = error?.response?.data || error;
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: e?.message || 'Terjadi Kesalahan', life: 3000 });
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    const handleAdjust = async (dataAdjust) => {
        if (isAllPreview === true) {
            cetakAllPreview(dataAdjust);
        } else {
            cetak(dataAdjust);
        }
        setIsAllPreview(false);
    };
    const [pdfUrl, setPdfUrl] = useState('');
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);

    const cetakAllPreview = async (dataAdjust) => {
        try {
            setLoadingPreview(true);
            const tableData = mutasiTabelFilt.map((item) => [
                item.Faktur,
                item.JenisMember + ' - ' + item.KetJenisMember,
                item.Kode + ' - ' + item.Nama,
                item.Alamat,
                item.Telepon,
                item.PointDebet,
                formatColumnValue(item.NominalPointDebet),
                item.PointKredit,
                formatColumnValue(item.NominalPointKredit),
                formatColumnValue(item.Jumlah)
            ]);

            const marginLeftInMm = parseFloat(dataAdjust.marginLeft);
            const marginTopInMm = parseFloat(dataAdjust.marginTop);
            const marginRightInMm = parseFloat(dataAdjust.marginRight);
            const doc = new jsPDF({
                orientation: dataAdjust?.orientation,
                unit: 'mm',
                format: dataAdjust?.paperSize,
                left: marginLeftInMm,
                right: marginRightInMm,
                putOnlyUsedFonts: true
            });

            let paraf1 = dataAdjust?.paraf1 || '';
            let paraf2 = dataAdjust?.paraf2 || '';
            let namaPetugas1 = dataAdjust?.namaPetugas1 || '';
            let namaPetugas2 = dataAdjust?.namaPetugas2 || '';
            let jabatan1 = dataAdjust?.jabatan1 || '';
            let jabatan2 = dataAdjust?.jabatan2 || '';

            if (!mutasiTabelFilt || mutasiTabelFilt.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());
            const judulLaporan = 'Rekap Mutasi Point Member';
            const periodeLaporan = 'Antara Tanggal ' + formatDate(startDate) + ' s.d ' + formatDate(endDate);
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });
            const totalAkumulasi = ['', '', '', '', 'TOTAL', formatColumnValue(totPointDebet), formatColumnValue(totNominalPointDebet), formatColumnValue(totPointKredit), formatColumnValue(totNominalPointKredit), formatColumnValue(totJumlah)];
            tableData.push(totalAkumulasi);
            const startY = 50 + marginTopInMm - 10;
            doc.autoTable({
                startY: startY,
                head: [['FAKTUR', 'JENIS MEMBER', 'NAMA MEMBER', 'ALAMAT MEMBER', 'TELEPON MEMBER', 'POINT DEBET', 'NOMINAL POINT DEBET', 'POINT KREDIT', 'NOMINAL POINT KREDIT', 'TOTAL TRANSAKSI']],
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
                    5: { halign: 'right' },
                    6: { halign: 'right' },
                    7: { halign: 'right' },
                    8: { halign: 'right' },
                    9: { halign: 'right' },
                    10: { halign: 'right' },
                    11: { halign: 'right' }
                },
                headerStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                didDrawPage: async function (data) {
                    addPageInfo(doc, userName, marginRightInMm);
                }
            });

            await Footer({ doc, marginLeftInMm, marginTopInMm, marginRightInMm, paraf1, paraf2, namaPetugas1, namaPetugas2, jabatan1, jabatan2 });
            const pdfDataUrl = doc.output('datauristring');
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
            setAdjustDialog(false);
            setLoadingPreview(false);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoadingPreview(false);
        }
    };

    const cetak = async (dataAdjust) => {
        try {
            setLoadingPreview(true);
            const marginLeftInMm = parseFloat(dataAdjust.marginLeft);
            const marginTopInMm = parseFloat(dataAdjust.marginTop);
            const marginRightInMm = parseFloat(dataAdjust.marginRight);
            const doc = new jsPDF({
                orientation: dataAdjust?.orientation,
                unit: 'mm',
                format: dataAdjust?.paperSize,
                left: marginLeftInMm,
                right: marginRightInMm,
                putOnlyUsedFonts: true
            });

            let paraf1 = dataAdjust?.paraf1 || '';
            let paraf2 = dataAdjust?.paraf2 || '';
            let namaPetugas1 = dataAdjust?.namaPetugas1 || '';
            let namaPetugas2 = dataAdjust?.namaPetugas2 || '';
            let jabatan1 = dataAdjust?.jabatan1 || '';
            let jabatan2 = dataAdjust?.jabatan2 || '';

            const pageWidth = doc.internal.pageSize.width;
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
            const tableData = mutasiMemberUsed.map((item) => [
                item.No,
                item.Faktur,
                formatDate(item.Tgl),
                parseInt(item.Jumlah).toLocaleString(),
                parseInt(item.PointDebet).toLocaleString(),
                parseInt(item.NominalPointDebet).toLocaleString(),
                parseInt(item.PointKredit).toLocaleString(),
                parseInt(item.NominalPointKredit).toLocaleString(),
                parseInt(item.Jumlah).toLocaleString()
            ]);
            // tableData.push(['', '', 'Total Items : ' + parseInt(jsonHeader.total_data).toLocaleString(), '', parseInt(jsonHeader.total).toLocaleString(), '', parseInt(jsonHeader.total_HJ).toLocaleString()]);

            doc.setFontSize(10);
            const dataGrid = [
                {
                    label: 'Member',
                    value: memberUsed.Member,
                    label2: 'Alamat',
                    value2: memberUsed.Alamat
                },
                {
                    label: 'Jenis Member',
                    value: memberUsed.JenisMember,
                    label2: 'Telepon',
                    value2: memberUsed.Telepon
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
                head: [['NO', 'FAKTUR', 'TGL', 'JUMLAH', 'POINT DEBET', 'NOMINAL POINT DEBET', 'POINT KREDIT', 'NOMINAL POINT KREDIT', 'TOTAL TRANSAKSI']],
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
                    1: { halign: 'center' },
                    2: { halign: 'center' },
                    3: { halign: 'right' },
                    4: { halign: 'right' },
                    5: { halign: 'right' },
                    6: { halign: 'right' },
                    7: { halign: 'right' },
                    8: { halign: 'right' }
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
                didDrawPage: (data) => {
                    addPageInfo(doc, userName, marginRightInMm);
                }
            });

            await Footer({ doc, marginLeftInMm, marginTopInMm, marginRightInMm, paraf1, paraf2, namaPetugas1, namaPetugas2, jabatan1, jabatan2 });

            const pdfDataUrl = doc.output('datauristring');
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
            setLoadingPreview(false);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoadingPreview(false);
        }
    };

    const totPointDebet = mutasiTabelFilt ? mutasiTabelFilt.reduce((accumulator, item) => accumulator + parseInt(item.PointDebet), 0) : 0;
    const totNominalPointDebet = mutasiTabelFilt ? mutasiTabelFilt.reduce((accumulator, item) => accumulator + parseInt(item.NominalPointDebet), 0) : 0;
    const totPointKredit = mutasiTabelFilt ? mutasiTabelFilt.reduce((accumulator, item) => accumulator + parseInt(item.PointKredit), 0) : 0;
    const totNominalPointKredit = mutasiTabelFilt ? mutasiTabelFilt.reduce((accumulator, item) => accumulator + parseInt(item.NominalPointKredit), 0) : 0;
    const totJumlah = mutasiTabelFilt ? mutasiTabelFilt.reduce((accumulator, item) => accumulator + parseInt(item.Jumlah), 0) : 0;

    let footerGroup = (
        <ColumnGroup>
            <Row>
                <Column headerStyle={{ textAlign: 'center' }} footer="Total:" colSpan={4} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`${formatRibuan(totPointDebet)}`} style={{ textAlign: 'center' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totNominalPointDebet)}`} style={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`${formatRibuan(totPointKredit)}`} style={{ textAlign: 'center' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totNominalPointKredit)}`} style={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totJumlah)}`} style={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} />
            </Row>
        </ColumnGroup>
    );

    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-print" severity="secondary" rounded onClick={() => funcPilihMember(rowData)} />
            </>
        );
    };

    // Yang Handle Excel
    const exportExcel = () => {
        exportToXLSX(mutasiTabelFilt, 'laporan-mutasi-point.xlsx');
    };

    return (
        <BlockUI
            blocked={loadingPreview}
            template={
                <div className="flex align-items-center justify-content-center flex-column gap-3" style={{ height: '100%' }}>
                    <div className="pi pi-spin pi-spinner" style={{ fontSize: '6rem' }}></div>
                    <p>Loading...</p>
                </ div>
            }
        >
            <div className="grid crud-demo">
                <div className="col-12">
                    <div className="card">
                        <h4>Mutasi Member</h4>
                        <hr />
                        <Toast ref={toast} />
                        <DataTable
                            value={mutasiTabelFilt}
                            first={first}
                            rows={rows}
                            onPage={onPage}
                            emptyMessage="Data Kosong"
                            filters={lazyState.filters}
                            size="small"
                            paginator
                            className="datatable-responsive"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                            totalRecords={totalRecords}
                            loading={loading}
                            header={headerSearch}
                            footerColumnGroup={footerGroup}
                        >
                            <Column headerStyle={{ textAlign: 'center' }} field="Faktur" header="FAKTUR"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="Kode" header="KODE MEMBER"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="Nama" header="NAMA"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="Alamat" header="ALAMAT"></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="PointDebet"
                                body={(rowData) => {
                                    const value = rowData.PointDebet ? parseInt(rowData.PointDebet).toLocaleString() : 0;
                                    return value;
                                }}
                                header="POINT DEBET"
                                bodyStyle={{ textAlign: 'center' }}
                            ></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="NominalPointDebet"
                                header="NOMINAL POINT DEBET"
                                body={(rowData) => {
                                    const value = rowData.NominalPointDebet ? parseInt(rowData.NominalPointDebet).toLocaleString() : 0;
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="PointKredit"
                                body={(rowData) => {
                                    const value = rowData.PointKredit ? parseInt(rowData.PointKredit).toLocaleString() : 0;
                                    return value;
                                }}
                                header="POINT KREDIT"
                                bodyStyle={{ textAlign: 'center' }}
                            ></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="NOMINALPOINTKREDIT"
                                header="NOMINAL POINT KREDIT"
                                body={(rowData) => {
                                    const value = rowData.NominalPointKredit ? parseInt(rowData.NominalPointKredit).toLocaleString() : 0;
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="Jumlah"
                                header="TOTAL TRANSAKSI"
                                body={(rowData) => {
                                    const value = rowData.Jumlah ? parseInt(rowData.Jumlah).toLocaleString() : 0;
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column header="ACTION" body={actionBodyTemplate}></Column>
                        </DataTable>
                        <Toolbar className="mb-4" left={preview}></Toolbar>
                        <AdjustPrintMarginLaporan loadingPreview={loadingPreview} adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} handleAdjust={handleAdjust} excel={exportExcel} />
                        <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                            {loadingPreview ? (
                                <div>
                                    <center>
                                        {' '}
                                        <i className="pi pi-spinner pi-spin" style={{ fontSize: '6.5em', padding: '10px' }} />
                                    </center>
                                </div>
                            ) : (
                                <div className="p-dialog-content">
                                    <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
                                </div>
                            )}
                        </Dialog>
                    </div>
                </div>
            </div>
        </BlockUI>
    );
}

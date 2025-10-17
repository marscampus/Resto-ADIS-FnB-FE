import jsPDF from 'jspdf';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Row } from 'primereact/row';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { convertToISODate, formatColumnValue, formatRibuan, getUserName, showError } from '../../../../component/GeneralFunction/GeneralFunction';
import PDFViewer from '../../../../component/PDFViewer.js';
import { Footer, addPageInfo, HeaderLaporan } from '../../../../component/exportPDF/exportPDF.js';
import AdjustPrintMarginLaporan from '../../../component/adjustPrintMarginLaporan';
import Member from '../../../component/member';
import { BlockUI } from 'primereact/blockui';
import postData from '../../../../lib/Axios';
import { getSessionServerSide } from '../../../../utilities/servertool';
import { Console } from 'escpos';
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
    const apiEndPointGet = '/api/mutasi_member/get_sisa';

    const toast = useRef(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [mutasiMember, setMutasiMember] = useState([]);
    const [mutasiMemberDialog, setMutasiMemberDialog] = useState(false);
    const [mutasiTabel, setMutasiTabel] = useState([]);
    const [mutasiTabelFilt, setMutasiTabelFilt] = useState(null);
    const [dates, setDates] = useState(null);
    const [search, setSearch] = useState('');
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const fileName = `laporan-sisa-point-member-${new Date().toISOString().slice(0, 10)}`;
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const op = useRef(null);

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
        loadLazyData();
    }, []);

    useEffect(() => {
        setMutasiTabelFilt(mutasiTabel);
    }, [mutasiTabel, lazyState]);

    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const loadLazyData = async () => {
        try {
            const requestBody = {
                ...lazyState
            };
            const vaTable = await postData(apiEndPointGet, requestBody);
            const json = vaTable.data;
            setTotalRecords(json.total_data);
            setMutasiTabel(json.data);
        } catch (error) {
            // Handle error appropriately, for example, show an error message
            setLoading(false);
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
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
    const dropdownValues = [
        { name: 'Member', label: 'Member' },
        { name: 'Nama Member', label: 'member.Nama' }
    ];
    const [defaultOption, setDropdownValue] = useState(null);
    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                {/* <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="name" placeholder="Pilih Kolom" /> */}
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
                x ? x.test(d.Kode) || x.test(d.Nama) || x.test(d.Alamat) || x.test(d.PointDebet) || x.test(d.NominalPointDebet) || x.test(d.PointKredit) || x.test(d.NominalPointKredit) || x.test(d.NominalSisaPoint) : []
            );
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = mutasiTabel;
            } else {
                filtered = mutasiTabel.filter((d) => (x ? x.test(d.Kode) : []));
            }
        }

        setMutasiTabelFilt(filtered);
    };

    const onSearch = (value) => {
        let _lazyState = { ...lazyState };
        _lazyState['filters'] = {};
        if (defaultOption != null && defaultOption.label != null) {
            _lazyState['filters'][defaultOption.label] = value;
        }
        onPage(_lazyState);
    };

    const [memberUsed, setMemberUsed] = useState([]);
    const [mutasiMemberUsed, setMutasiMemberUsed] = useState([]);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [pilihMemberDialog, setPilihMemberDialog] = useState(false);

    const preview = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Preview" icon="pi pi-file-o" outlined className="p-button-secondary p-button-sm mr-2" onClick={() => {
                        setAdjustDialog(true);
                    }} />
                </div>
            </React.Fragment>
        );
    };
    // -----------------------------------------------------------------------------------------------------------------< Member >

    const handleAdjust = async (dataAdjust) => {
        cetakAllPreview(dataAdjust);
    };

    // Yang Handle Excel
    const exportExcel = () => {
        exportToXLSX(mutasiTabelFilt, 'laporan-sisa-point.xlsx');
    };

    const [pdfUrl, setPdfUrl] = useState('');
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const cetakAllPreview = async (dataAdjust) => {
        try {
            setLoadingPreview(true);
            const tableData = mutasiTabelFilt.map((item) => [
                item.Kode,
                item.TglTerakhir,
                item.Nama,
                item.Alamat,
                formatColumnValue(item.PointDebet),
                formatColumnValue(item.NominalPointDebet),
                formatColumnValue(item.PointKredit),
                formatColumnValue(item.NominalPointKredit || 0),
                formatColumnValue(item.SisaPoint),
                formatColumnValue(item.NominalSisaPoint),
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

            const userName = await getUserName();
            const judulLaporan = 'Rekap Sisa Point Member ';
            const periodeLaporan = '';
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });
            const totalAkumulasi = [
                '',
                '',
                '',
                'TOTAL',
                formatColumnValue(totPointDebet),
                formatColumnValue(totNominalPointDebet),
                formatColumnValue(totPointKredit),
                formatColumnValue(totNominalPointKredit),
                formatColumnValue(totPointSisaPoint),
                formatColumnValue(totSisaPoint),
                formatColumnValue(totJumlah)];
            tableData.push(totalAkumulasi);
            const startY = 50 + marginTopInMm - 10;
            doc.autoTable({
                startY: startY,
                head: [['KODE', 'TGL. TRANS. TERAKHIR', 'NAMA', 'ALAMAT', 'POINT DEBET', 'NOMINAL POINT DEBET', 'POINT KREDIT', 'NOMINAL POINT KREDIT', 'SISA POINT', 'NOMINAL SISA POINT', 'TOTAL TRANSAKSI']],
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
                    2: { halign: 'center' },
                    3: { halign: 'right' },
                    4: { halign: 'right' },
                    5: { halign: 'right' },
                    6: { halign: 'right' },
                    7: { halign: 'right' },
                    8: { halign: 'right' },
                    9: { halign: 'right' }
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
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoadingPreview(false);
        }
    };

    const totPointDebet = mutasiTabelFilt ? mutasiTabelFilt.reduce((accumulator, item) => accumulator + parseInt(item.PointDebet), 0) : 0;
    const totPointKredit = mutasiTabelFilt ? mutasiTabelFilt.reduce((accumulator, item) => accumulator + parseInt(item.PointKredit), 0) : 0;
    const totPointSisaPoint = mutasiTabelFilt ? mutasiTabelFilt.reduce((accumulator, item) => accumulator + parseInt(item.SisaPoint), 0) : 0;
    const totNominalPointDebet = mutasiTabelFilt ? mutasiTabelFilt.reduce((accumulator, item) => accumulator + parseInt(item.NominalPointDebet), 0) : 0;
    const totNominalPointKredit = mutasiTabelFilt ? mutasiTabelFilt.reduce((accumulator, item) => accumulator + parseInt(item.NominalPointKredit), 0) : 0;
    const totSisaPoint = mutasiTabelFilt ? mutasiTabelFilt.reduce((accumulator, item) => accumulator + parseInt(item.NominalSisaPoint), 0) : 0;
    const totJumlah = mutasiTabelFilt ? mutasiTabelFilt.reduce((accumulator, item) => accumulator + parseInt(item.Jumlah), 0) : 0;

    let footerGroup = (
        <ColumnGroup>
            <Row>
                <Column headerStyle={{ textAlign: 'center' }} footer="Total:" colSpan={3} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`${formatRibuan(totPointDebet)}`} style={{ textAlign: 'center' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totNominalPointDebet)}`} style={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`${formatRibuan(totPointKredit)}`} style={{ textAlign: 'center' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totNominalPointKredit)}`} style={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`${formatRibuan(totPointSisaPoint)}`} style={{ textAlign: 'center' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totSisaPoint)}`} style={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totJumlah)}`} style={{ textAlign: 'right' }} />
            </Row>
        </ColumnGroup>
    );

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
                        <h4>Sisa Point Member</h4>
                        <hr />
                        <Toast ref={toast} />
                        <DataTable
                            value={mutasiTabelFilt}
                            filters={lazyState.filters}
                            header={headerSearch}
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
                            footerColumnGroup={footerGroup}
                        >
                            <Column headerStyle={{ textAlign: 'center' }} field="Kode" header="KODE" bodyStyle={{ textAlign: 'center' }}></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="TglTerakhir" header="TGL. TRANS. TERAKHIR"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="Nama" header="NAMA"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="Alamat" header="ALAMAT"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="PointDebet" header="POINT DEBET" bodyStyle={{ textAlign: 'center' }}></Column>
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
                            <Column headerStyle={{ textAlign: 'center' }} field="PointKredit" header="POINT KREDIT" bodyStyle={{ textAlign: 'center' }}></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="NominalPointKredit"
                                header="NOMINAL POINT KREDIT"
                                body={(rowData) => {
                                    const value = rowData.NominalPointKredit ? parseInt(rowData.NominalPointKredit).toLocaleString() : 0;
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="SisaPoint" header="SISA POINT" bodyStyle={{ textAlign: 'center' }}></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="NominalSisaPoint"
                                header="NOMINAL SISA POINT"
                                body={(rowData) => {
                                    const value = rowData.NominalSisaPoint ? parseInt(rowData.NominalSisaPoint).toLocaleString() : 0;
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
                        </DataTable>
                        <Toolbar className="mb-4" left={preview}></Toolbar>

                        <AdjustPrintMarginLaporan loadingPreview={loadingPreview} adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} handleAdjust={handleAdjust} excel={exportExcel} />
                        <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                            {loadingPreview ? (
                                // Tampilkan indikator loading jika masih dalam proses loading
                                <div>
                                    <center>
                                        {' '}
                                        <i className="pi pi-spinner pi-spin" style={{ fontSize: '6.5em', padding: '10px' }} />
                                    </center>
                                    {/* <span style={{ fontSize: "7.5em", marginLeft: "3px" }}>Loading...</span> */}
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

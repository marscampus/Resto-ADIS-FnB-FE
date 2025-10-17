import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import React, { useEffect, useRef, useState } from 'react';
import PDFViewer from '../../../component/PDFViewer.js';
import { formatDate, convertToISODate, formatColumnValue, getUserName, getEmail, showError, showSuccess } from '../../../component/GeneralFunction/GeneralFunction';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import jsPDF from 'jspdf';
import { Footer, Header, addPageInfo } from '../../../component/exportPDF/exportPDF.js';
import { BlockUI } from 'primereact/blockui';
import postData from '../../../lib/Axios';
import { getSessionServerSide } from '../../../utilities/servertool';
import AdjustPrintMarginPDF from '../../component/adjustPrintMarginPDF.js';
export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}
export default function MasterCetakFaktur() {
    const apiEndPointGet = '/api/kasir/cetak-faktur';
    const apiEndPointGetDataByFaktur = '/api/kasir/cetak-faktur/getdata_byfaktur';
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const dropdownValues = [
        { name: 'Purchase Order', label: 'Purchase Order' },
        { name: 'Pembelian', label: 'Pembelian' },
        { name: 'Retur Pembelian', label: 'Retur Pembelian' }
    ];
    const [defaultOption, setDropdownValue] = useState(dropdownValues[0]);
    const [cetakFaktur, setCetakFaktur] = useState({ KATEGORI: defaultOption.name });
    const [cetakFakturTabel, setCetakFakturTabel] = useState([]);
    const [cetakFakturTabelFilt, setCetakFakturTabelFilt] = useState([]);
    const [pdfUrl, setPdfUrl] = useState('');
    const [search, setSearch] = useState('');
    const fileName = `laporan-cetak-faktur-${new Date().toISOString().slice(0, 10)}`;
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    // JSPDF
    const [showPreview, setShowPreview] = useState(false);
    const [marginTop, setMarginTop] = useState(10);
    const [marginLeft, setMarginLeft] = useState(10);
    const [marginRight, setMarginRight] = useState(10);
    const [marginBottom, setMarginBottom] = useState(10);
    const [tableWidth, setTableWidth] = useState(800);
    const [orientation, setOrientation] = useState('portrait');
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
    const paperSizes = [
        { name: 'A4', value: 'A4' },
        { name: 'Letter', value: 'Letter' },
        { name: 'Legal', value: 'Legal' }
    ];
    const orientationOptions = [
        { label: 'Potret', value: 'portrait' },
        { label: 'Lanskap', value: 'landscape' }
    ];
    const handlePaperSizeChange = (event) => {
        setSelectedPaperSize(event.target.value);
    };
    const handleOrientationChange = (event) => {
        setOrientation(event.target.value);
    };
    function handleShowPreview() {
        setShowPreview(true);
    }
    const itemsSkelaton = Array.from({ length: 2 }, (v, i) => i);
    const columns = [{ field: 'KODE', header: 'KODE' }];

    const op = useRef(null);

    const onPage = (event) => {
        setlazyState(event);
    };

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    useEffect(() => {
        setCetakFakturTabelFilt(cetakFakturTabel);
    }, [cetakFakturTabel, lazyState]);

    const loadLazyData = async () => {
        try {
            setLoading(true);
            const requestBody = {
                ...lazyState,
                START_DATE: convertToISODate(startDate),
                END_DATE: convertToISODate(endDate),
                KATEGORI: defaultOption.name
            };
            const vaTable = await postData(apiEndPointGet, requestBody);
            const json = vaTable.data;
            setTotalRecords(json.total_data);
            setCetakFakturTabel(json.data);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
        setLoading(false);
    };

    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    // -----------------------------------------------------------------------------------------------------------------< Handle Calendar >
    const handleStartDateChange = (e) => {
        setStartDate(e.value);
    };
    const handleEndDateChange = (e) => {
        setEndDate(e.value);
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-file" severity="warning" rounded className="mr-2" onClick={() => print(rowData)} />
            </>
        );
    };

    // -----------------------------------------------------------------------------------------------------------------< Adjust Print Margin >
    const [dataDetail, setDataDetail] = useState([]);

    const [totData, setTotData] = useState([]);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const print = async (rowData) => {
        const { FAKTUR } = rowData;
        try {
            let requestBody = {
                FAKTUR: FAKTUR
            };
            const vaTable = await postData(apiEndPointGetDataByFaktur, requestBody);
            const json = vaTable.data;
            showSuccess(toast, json?.message)
            setTotData(json.data);
            setDataDetail(json.data.detail);
            setAdjustDialog(true);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const handleAdjust = async (dataAdjust) => {
        cetak(dataAdjust);
    };

    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(true);

    const cetak = async (dataAdjust) => {
        try {
            setLoadingPreview(true);
            const rekapPDF = dataDetail ? JSON.parse(JSON.stringify(dataDetail)) : [];
            const tableData = rekapPDF.map((item, index) => [index + 1, item.BARCODE, item.stock.NAMA, formatColumnValue(item.HARGA), item.QTY, formatColumnValue(item.DISCOUNT), formatColumnValue(item.JUMLAH)]);

            const marginLeftInMm = parseFloat(dataAdjust.marginLeft);
            const marginTopInMm = parseFloat(dataAdjust.marginTop);
            const marginRightInMm = parseFloat(dataAdjust.marginRight);
            const userName = await getUserName(await getEmail());
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

            if (!rekapPDF || rekapPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const judulLaporan = totData.TITLE;
            const supplier = '[' + totData.SUPPLIER + ']';
            const namaSupplier = totData.NAMASUPPLIER;
            const addressSupplier = totData.ALAMATSUPPLIER;
            let faktur;
            let rowTgl;
            if (judulLaporan === 'Purchase Order') {
                faktur = totData.FAKTUR;
                rowTgl = 'PO Date : ' + formatDate(totData.TGL) + '     |     Delivery Date : ' + formatDate(totData.TGLDO) + '     |     Payment Date : ' + formatDate(totData.PAYMENTDATE);
            } else if (judulLaporan === 'Pembelian Penerimaan Barang') {
                faktur = 'PO - ' + totData.FAKTURPO + '  |  ' + 'Pembelian - ' + totData.FAKTUR;
                rowTgl = 'Date : ' + formatDate(totData.TGL) + '     |     Jatuh Tempo : ' + formatDate(totData.PAYMENTDATE) + '     |     Gudang :  [' + totData.GUDANG + '] ' + totData.KETGUDANG;
            } else {
                faktur = 'PO - ' + totData.FAKTURPO + '  |  ' + 'Retur Pembelian - ' + totData.FAKTUR;
                rowTgl = 'Date : ' + formatDate(totData.TGL) + '     |     Jatuh Tempo : ' + formatDate(totData.PAYMENTDATE) + '     |     Gudang :  [' + totData.GUDANG + '] ' + totData.KETGUDANG;
            }

            await Header({ doc, marginTopInMm, judulLaporan, faktur, supplier, namaSupplier, addressSupplier, rowTgl });

            const startY = 50 + marginTopInMm - 10;
            doc.autoTable({
                startY: startY,
                head: [['No', 'BARCODE', 'NAMA BARANG', 'HARGA', 'QTY', 'DISCOUNT', 'JUMLAH']],
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
                    4: { halign: 'center' },
                    5: { halign: 'right' },
                    6: { halign: 'right' }
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

            var tableTotal = [
                ['DISCOUNT : ', `${formatColumnValue(totData.DISCOUNT || 0)}`, '    ', '          ', '                                  ', 'SUBTOTAL : ', ` ${formatColumnValue(totData.SUBTOTAL || 0)}`],
                ['FAKTUR ASLI : ', `${formatColumnValue(totData.FAKTURASLI)}`, '    ', '          ', '                                  ', 'PPN : ', ` ${formatColumnValue(totData.PPN || 0)}`],
                ['              ', '                                        ', '    ', '          ', '                                  ', 'TOTAL : ', `${formatColumnValue(totData.TOTAL || 0)}`]
            ];
            var options = {
                startY: doc.autoTable.previous.finalY,
                theme: 'plain',
                margin: {
                    top: marginTopInMm,
                    left: marginLeftInMm,
                    right: marginRightInMm
                },
                styles: {
                    width: '100%',
                    cellWidth: 'auto',
                    valign: 'middle',
                    halign: 'right',
                    columnWidth: 'auto',
                    fontSize: 9
                },
                columnStyles: {
                    0: { cellWidth: 'auto', halign: 'left' },
                    1: { cellWidth: 'auto', halign: 'left' },
                    2: { cellWidth: '200px' }
                }
            };
            doc.autoTable({
                body: tableTotal,
                ...options
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

    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                {/* <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="name" placeholder="Pilih kolom" /> */}
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
            filtered = cetakFakturTabel.filter((d) => (x ? x.test(d.FAKTUR) || x.test(d.FAKTURASLI) || x.test(d.SUPPLIER) || x.test(d.TGL) || x.test(d.JTHTMP) || x.test(d.SUBTOTAL) || x.test(d.PPN) || x.test(d.DISCOUNT) || x.test(d.TOTAL) : []));
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = cetakFakturTabel;
            } else {
                filtered = cetakFakturTabel.filter((d) => (x ? x.test(d.KodeDiskon) : []));
            }
        }

        setCetakFakturTabelFilt(filtered);
    };

    return (
        <BlockUI
            blocked={loading}
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
                        <h4>Cetak Faktur</h4>
                        <hr />
                        <Toast ref={toast} />
                        <div className="formgrid grid">
                            <div className="field col-6 mb-2 lg:col-6">
                                <label htmlFor="faktur">Periode</label>
                                <div className="p-inputgroup">
                                    <Calendar name="startDate" value={cetakFaktur?.START_DATE || startDate} onChange={handleStartDateChange} placeholder="Start Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                                    <Calendar name="endDate" value={cetakFaktur?.END_DATE || endDate} onChange={handleEndDateChange} placeholder="End Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                                    <Button label="" icon="pi pi-calendar" className="p-button-primary mr-2" />
                                </div>
                            </div>
                            <div className="field col-4 mb-2 lg:col-4">
                                <label htmlFor="faktur">Kategori</label>
                                <div className="p-inputgroup">
                                    <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="label" placeholder="Pilih Kategori" />
                                </div>
                            </div>
                            <div className="field col-2 mb-2 lg:col-2">
                                <label></label>
                                <div className="p-inputgroup mt-2">
                                    <Button label="Refresh" className="p-button-primary p-button-md w-full mr-1" onClick={() => loadLazyData()} />
                                </div>
                            </div>
                        </div>
                        <DataTable
                            value={cetakFakturTabelFilt}
                            lazy
                            filters={lazyState.filters}
                            emptyMessage="Data Kosong"
                            header={headerSearch}
                            size="small"
                            paginator
                            rows={10}
                            className="datatable-responsive"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                            first={lazyState.first}
                            totalRecords={totalRecords}
                            onPage={onPage}
                            loading={loading}
                        >
                            <Column headerStyle={{ textAlign: 'center' }} field="FAKTUR" header="FAKTUR"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="FAKTURASLI" header="FAKTURASLI"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="SUPPLIER" header="SUPPLIER"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="TGL" header="TANGGAL"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="JTHTMP" header="JTHTMP"></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="SUBTOTAL"
                                header="SUBTOTAL"
                                body={(rowData) => {
                                    const value = rowData.SUBTOTAL ? parseInt(rowData.SUBTOTAL).toLocaleString() : 0;
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="PPN"
                                header="PPN"
                                body={(rowData) => {
                                    const value = rowData.PPN ? parseInt(rowData.PPN).toLocaleString() : 0;
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="DISCOUNT"
                                header="DISCOUNT"
                                body={(rowData) => {
                                    const value = rowData.DISCOUNT ? parseInt(rowData.DISCOUNT).toLocaleString() : 0;
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="TOTAL"
                                header="TOTAL"
                                body={(rowData) => {
                                    const value = rowData.TOTAL ? parseInt(rowData.TOTAL).toLocaleString() : 0;
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="DATETIME" header="DATETIME"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="USERNAME" header="USERNAME"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate}></Column>
                        </DataTable>

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
                        <AdjustPrintMarginPDF loadingPreview={loadingPreview} adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} handleAdjust={handleAdjust} />
                    </div>
                </div>
            </div>
        </BlockUI>
    );
}

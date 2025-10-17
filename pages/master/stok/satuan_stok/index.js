import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import { getEmail, getUserName, showError, showSuccess } from '../../../../component/GeneralFunction/GeneralFunction';
import PDFViewer from '../../../../component/PDFViewer';
import { Footer, HeaderLaporan, addPageInfo } from '../../../../component/exportPDF/exportPDF';
import { exportToXLSX } from '../../../../component/exportXLSX/exportXLSX';
import postData from '../../../../lib/Axios';
import { getSessionServerSide } from '../../../../utilities/servertool';
import AdjustPrintMarginLaporan from '../../../component/adjustPrintMarginLaporan';
import { BlockUI } from 'primereact/blockui';
export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}
export default function satuanStock() {
    // API READ
    const apiEndPointGet = '/api/satuan_stock/get';
    // API STORE
    const apiEndPointStore = '/api/satuan_stock/store';
    // API UPDATE
    const apiEndPointUpdate = '/api/satuan_stock/update';
    // API DELETE
    const apiEndPointDelete = '/api/satuan_stock/delete';

    const toast = useRef(null);
    const [loading, setLoading] = useState(false); const [loadingPreview, setLoadingPreview] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [deleteSatuanStockDialog, setDeleteSatuanStockDialog] = useState(false);
    const [satuanStock, setSatuanStock] = useState([]);
    const [satuanStockDialog, setSatuanStockDialog] = useState(false);
    const [satuanStockTabel, setSatuanStockTabel] = useState(null);
    const [satuanStockTabelFilt, setSatuanStockTabelFilt] = useState(null);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [search, setSearch] = useState('');
    const fileName = `master-satuan-stock-${new Date().toISOString().slice(0, 10)}`;
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');

    //  ------------------------------------------------------------------------------------------------------- Preparation
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

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
    }, [lazyState]);

    useEffect(() => {
        setSatuanStockTabelFilt(satuanStockTabel);
    }, [satuanStockTabel, lazyState]);

    const loadLazyData = async () => {
        setLoading(true);
        let requestBody = { ...lazyState };
        try {
            const vaTable = await postData(apiEndPointGet, requestBody);
            const json = vaTable.data;
            setSatuanStockTabel(json.data);
            setTotalRecords(json.total_data);
        } catch (error) {
            let e = error?.response?.data || error;
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: e?.message || 'Terjadi Kesalahan', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    // -------------------------------------------------------------------------------------------------------------------- Dialog
    const openNew = () => {
        setSatuanStock([]);

        setSatuanStockDialog(true);
        setIsUpdateMode(false);
    };

    // ----------------------------------------------------------------------------------------------------------------- Hide Dialog
    const hideDialog = () => {
        setSatuanStockDialog(false);
    };
    const hideDeleteSatuanStockDialog = () => {
        setDeleteSatuanStockDialog(false);
    };

    // -------------------------------------------------------------------------------------------------------------------- Func
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _satuanStock = { ...satuanStock };
        _satuanStock[`${name}`] = val;

        setSatuanStock(_satuanStock);
    };
    const saveSatuanStock = async (e) => {
        e.preventDefault();
        let _satuanStockTabel = [...satuanStockTabel];
        let _satuanStock = { ...satuanStock };
        try {
            let endPoint;
            if (isUpdateMode) {
                endPoint = apiEndPointUpdate;
            } else {
                endPoint = apiEndPointStore;
            }
            const vaTable = await postData(endPoint, _satuanStock);
            let data = vaTable.data;
            showSuccess(toast, data?.message)
            setSatuanStockDialog(false);
            setSatuanStockTabel(_satuanStockTabel);
            loadLazyData();
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    const editSatuanStock = (satuanStock) => {
        setSatuanStock({ ...satuanStock });
        setSatuanStockDialog(true);
        setIsUpdateMode(true);
    };

    const confirmDeleteSatuanStock = (satuanStock) => {
        setSatuanStock(satuanStock);
        setDeleteSatuanStockDialog(true);
    };

    const deleteSatuanStock = async () => {
        let requestBody = {
            KODE: satuanStock.KODE
        };
        try {
            const vaTable = await postData(apiEndPointDelete, requestBody);
            let data = vaTable.data;
            showSuccess(toast, data?.message);
            setSatuanStock([]);
            setDeleteSatuanStockDialog(false);
            loadLazyData();
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (satuanStockTabel.length == 0 || !satuanStockTabel) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong', life: 3000 });
            return;
        }
        setAdjustDialog(true);
    };

    const handleAdjust = async (dataAdjust) => {
        exportPDF(dataAdjust);
    };

    const exportPDF = async (dataAdjust) => {
        setLoadingPreview(true);
        try {
            const satuanStockTabelPDF = satuanStockTabelFilt ? JSON.parse(JSON.stringify(satuanStockTabelFilt)) : [];

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

            if (!satuanStockTabelPDF || satuanStockTabelPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Master Satuan Stock';
            const periodeLaporan = '';
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = satuanStockTabelPDF.map((item) => [item.KODE, item.KETERANGAN]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['KODE', 'KETERANGAN']],
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
                columnStyles: {},
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

            await Footer({ doc, marginLeftInMm, marginTopInMm, marginRightInMm, paraf1, paraf2, namaPetugas1, namaPetugas2, jabatan1, jabatan2 });
            const pdfDataUrl = doc.output('datauristring');
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
            setShowPreview(false);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoadingPreview(false);
        }
    };

    // Yang Handle Excel
    const exportExcel = () => {
        exportToXLSX(satuanStockTabelFilt, 'master-satuanStock.xlsx');
    };

    // ---------------------------------------------------------------------------------------------------------------- Button
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew} />
                    {/* <Button label="Delete" icon="pi pi-trash" className="p-button-danger" onClick={confirmDeleteSelected} readOnly={!selectedsatuanStocks || !selectedsatuanStocks.length} /> */}
                </div>
            </React.Fragment>
        );
    };

    const previewSatuanStock = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Preview" icon="pi pi-file-o" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnAdjust} />
                </div>
            </React.Fragment>
        );
    };
    const satuanStockDialogFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveSatuanStock} />
        </>
    );

    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-pencil" severity="success" rounded className="mr-2" onClick={() => editSatuanStock(rowData)} />
                <Button icon="pi pi-trash" severity="warning" rounded onClick={() => confirmDeleteSatuanStock(rowData)} />
            </>
        );
    };

    const deleteSatuanStockDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={hideDeleteSatuanStockDialog} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deleteSatuanStock} />
        </>
    );

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
            filtered = satuanStockTabel.filter((d) => (x ? x.test(d.KODE) || x.test(d.KETERANGAN) : []));
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = satuanStockTabel;
            } else {
                filtered = satuanStockTabel.filter((d) => (x ? x.test(d.KODE) : []));
            }
        }

        setSatuanStockTabelFilt(filtered);
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
                        <h4>Menu Satuan Stock</h4>
                        <hr />
                        <Toast ref={toast} />
                        <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>

                        <DataTable
                            value={satuanStockTabelFilt}
                            filters={lazyState.filters}
                            header={headerSearch}
                            first={first} // Menggunakan nilai halaman pertama dari state
                            rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                            onPage={onPage}
                            paginator
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                            totalRecords={totalRecords}
                            size="small"
                            loading={loading}
                            className="datatable-responsive"
                            emptyMessage="Data Kosong"
                        >
                            <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate}></Column>
                        </DataTable>
                        <Toolbar className="mb-4" left={previewSatuanStock}></Toolbar>

                        {/* Dialog SatuanStock */}
                        <Dialog visible={satuanStockDialog} header="Tambah SatuanStock Stok" modal className="p-fluid" footer={satuanStockDialogFooter} onHide={hideDialog}>
                            <div className="formgrid grid">
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label htmlFor="kode">Kode</label>
                                    <div className="p-inputgroup">
                                        <InputText autoFocus id="kode" value={satuanStock.KODE} onChange={(e) => onInputChange(e, 'KODE')} readOnly={isUpdateMode} />
                                    </div>
                                </div>
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label htmlFor="keterangan">Keterangan</label>
                                    <InputText id="keterangan" value={satuanStock.KETERANGAN} onChange={(e) => onInputChange(e, 'KETERANGAN')} required />
                                </div>
                            </div>
                        </Dialog>
                        <Dialog visible={deleteSatuanStockDialog} header="Confirm" modal footer={deleteSatuanStockDialogFooter} onHide={hideDeleteSatuanStockDialog}>
                            <div className="flex align-items-center justify-content-center">
                                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                                {satuanStock && (
                                    <span>
                                        Yakin ingin menghapus data <strong>{satuanStock.KODE}</strong> ?
                                    </span>
                                )}
                            </div>
                        </Dialog>
                    </div>
                </div>
                <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
                <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                    <div className="p-dialog-content">
                        <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
                    </div>
                </Dialog>
            </div>
        </BlockUI>
    );
}

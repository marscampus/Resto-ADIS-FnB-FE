import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { RadioButton } from 'primereact/radiobutton';
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
import MultipleRekeningCOA from '../../../component/multipleRekeningCOA';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}
export default function MasterBank() {
    // API READ
    const apiEndPointGet = '/api/bank/get';
    // API DELETE
    const apiEndPointDelete = '/api/bank/delete';
    // API STORE
    const apiEndPointStore = '/api/bank/store';
    // API EDIT
    const apiEndPointUpdate = '/api/bank/update';

    let emptybank = {
        KODE: '',
        KETERANGAN: '',
        REKENING: '',
        ADMINISTRASI: 0,
        PENARIKANTUNAI: ''
    };

    const toast = useRef(null);
    const [rekeningDialog, setRekeningDialog] = useState(false);
    const [bankDialog, setBankDialog] = useState(false);
    const [deleteBankDialog, setDeleteBankDialog] = useState(false);
    const [bank, setBank] = useState(emptybank);
    const [loading, setLoading] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [bankTabel, setBankTabel] = useState(null);
    const [bankTabelFilt, setBankTabelFilt] = useState([]);
    const [statusAction, setStatusAction] = useState(null);
    const [edit, setEdit] = useState(false);
    const [search, setSearch] = useState('');
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [activeFormField, setActiveFormField] = useState(null);
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    const [adjustDialog, setAdjustDialog] = useState(false);
    const fileName = `master-bank-${new Date().toISOString().slice(0, 10)}`;

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
        setEdit(false);
        loadLazyData();
    }, [lazyState]);

    const loadLazyData = async () => {
        setLoading(true);
        let requestBody = { ...lazyState };
        try {
            const vaTable = await postData(apiEndPointGet, requestBody);
            const json = vaTable.data;
            setBankTabel(json.data);
            setTotalRecords(json.total_data);
        } catch (error) {
            let e = error?.response?.data || error;
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: e?.message || 'Terjadi Kesalahan', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const openNew = () => {
        setBank(emptybank);
        setBankDialog(true);
        setStatusAction('store');
    };

    const hideDialog = () => {
        setEdit(false);
        setBankDialog(false);
    };

    const hideDeleteBankDialog = () => {
        setDeleteBankDialog(false);
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _bank = { ...bank };
        _bank[`${name}`] = val;

        setBank(_bank);
    };

    const onInputNumberChange = (e, name) => {
        const val = e.value ?? 0;
        let _bank = { ...bank };
        _bank[`${name}`] = val;

        setBank(_bank);
    };

    const onPenarikanTunaiChange = (e) => {
        let _bank = { ...bank };
        _bank['PENARIKANTUNAI'] = e.value;
        setBank(_bank);
    };

    const saveBank = async (e) => {
        e.preventDefault();
        let _bank = { ...bank };
        try {
            let endPoint;
            if (statusAction === 'update') {
                endPoint = apiEndPointUpdate;
            } else {
                endPoint = apiEndPointStore;
            }
            const vaTable = await postData(endPoint, _bank);
            let data = vaTable.data;
            showSuccess(toast, data?.message)
            setBankDialog(false);
            loadLazyData();
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    const editBank = (bank) => {
        setBank({ ...bank });
        setBankDialog(true);
        setStatusAction('update');
        setEdit(true);
    };

    const confirmDeleteBank = (bank) => {
        setBank(bank);
        setDeleteBankDialog(true);
    };

    const deleteBank = async () => {
        let requestBody = {
            KODE: bank.KODE
        };
        try {
            const vaTable = await postData(apiEndPointDelete, requestBody);
            let data = vaTable.data;
            showSuccess(toast, data?.message)
            setBank(emptybank);
            loadLazyData();
            setDeleteBankDialog(false);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew} />
                    {/* <Button label="Delete" icon="pi pi-trash" className="p-button-danger" onClick={confirmDeleteSelected} disabled={!selectedbanks || !selectedbanks.length} /> */}
                </div>
            </React.Fragment>
        );
    };

    const bankDialogFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveBank} />
        </>
    );

    const deleteBankDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={hideDeleteBankDialog} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deleteBank} />
        </>
    );

    const penarikantunaiBodyTemplate = (rowData) => {
        return <span> {rowData.PENARIKANTUNAI == 'Y' ? 'YA' : 'TIDAK'} </span>;
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-pencil" severity="success" rounded className="mr-2" onClick={() => editBank(rowData)} />
                <Button icon="pi pi-trash" severity="warning" rounded onClick={() => confirmDeleteBank(rowData)} />
            </>
        );
    };

    // Yang Handle Rekening
    const btnRekening = () => {
        setRekeningDialog(true);
    };

    const onRowSelectKode = (event, formField) => {
        const selectedRow = event.data;
        setBank((p) => ({
            ...p,
            REKENING: selectedRow.kode,
        }));
        setRekeningDialog(false);
    };

    useEffect(() => {
        setBankTabelFilt(bankTabel);
    }, [bankTabel, lazyState]);

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = bankTabel.filter((d) => (x ? x.test(d.KODE) || x.test(d.REKENING) || x.test(d.ADMINISTRASI) || x.test(d.KETERANGAN) : []));
            setSearch(searchVal);
        }

        setBankTabelFilt(filtered);
    };

    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup">
                </div>
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => filterPlugins('search', e.target.value)} placeholder="Search..." value={search} />
                </span>
            </div>
        </div>
    );

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (bankTabel.length == 0 || !bankTabel) {
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
            const bankPDF = bankTabelFilt ? JSON.parse(JSON.stringify(bankTabelFilt)) : [];

            const marginLeftInMm = parseFloat(dataAdjust.marginLeft);
            const marginTopInMm = parseFloat(dataAdjust.marginTop);
            const marginRightInMm = parseFloat(dataAdjust.marginRight);
            let paraf1 = dataAdjust?.paraf1 || '';
            let paraf2 = dataAdjust?.paraf2 || '';
            let namaPetugas1 = dataAdjust?.namaPetugas1 || '';
            let namaPetugas2 = dataAdjust?.namaPetugas2 || '';
            let jabatan1 = dataAdjust?.jabatan1 || '';
            let jabatan2 = dataAdjust?.jabatan2 || '';
            const doc = new jsPDF({
                orientation: dataAdjust?.orientation,
                unit: 'mm',
                format: dataAdjust?.paperSize,
                left: marginLeftInMm,
                right: marginRightInMm,
                putOnlyUsedFonts: true
            });

            if (!bankPDF || bankPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Master Bank';
            const periodeLaporan = '';
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = bankPDF.map((item) => [item.KODE, item.KETERANGAN, item.REKENING, parseInt(item.ADMINISTRASI).toLocaleString() ?? '', item.PENARIKANTUNAI === 'Y' ? 'YA' : 'TIDAK']);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['KODE.', 'KETERANGAN', 'REKENING', 'ADMINISTRASI', 'PENARIKAN TUNAI']],
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
                    3: { halign: 'right' }
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

            await Footer({ doc, marginLeftInMm, marginTopInMm, marginRightInMm, paraf1, paraf2, namaPetugas1, namaPetugas2, jabatan1, jabatan2 });
            const pdfDataUrl = doc.output('datauristring');
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoadingPreview(false);
        }
    };

    // Yang Handle Excel
    const exportExcel = () => {
        exportToXLSX(bankTabelFilt, 'master-bank.xlsx');
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
                        <h4>Menu Bank</h4>
                        <hr />
                        <Toast ref={toast} />
                        <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>

                        <DataTable
                            value={bankTabelFilt}
                            dataKey="KODE"
                            paginator
                            className="datatable-responsive"
                            totalRecords={totalRecords}
                            loading={loading}
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                            size="small"
                            header={headerSearch}
                            filters={lazyState.filters}
                            first={first} // Menggunakan nilai halaman pertama dari state
                            rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                            onPage={onPage}
                            emptyMessage="Data Kosong"
                        >
                            {/* <Column headerStyle={{ textAlign: "center" }} field="NO" header="#" body={(rowData) => coa.indexOf(rowData) + 1}></Column> */}
                            <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="REKENING" header="REKENING"></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="ADMINISTRASI"
                                header="ADMINISTRASI"
                                body={(rowData) => {
                                    const value = rowData.ADMINISTRASI ? parseInt(rowData.ADMINISTRASI).toLocaleString() : 0;
                                    return value;
                                }}
                                style={{ textAlign: 'right' }}
                            ></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="PENARIKANTUNAI" body={penarikantunaiBodyTemplate} header="PENARIKAN TUNAI" style={{ textAlign: 'center' }}></Column>
                            <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate}></Column>
                        </DataTable>
                        <Toolbar className="mb-4" left={preview}></Toolbar>

                        <Dialog visible={bankDialog} style={{ width: '75%' }} header="Bank Details" modal className="p-fluid" footer={bankDialogFooter} onHide={hideDialog}>
                            <div className="formgrid grid">
                                <div className="field col-6 mb-2 lg:col-6">
                                    <label htmlFor="kode">Kode</label>
                                    <InputText disabled={edit} id="kode" value={bank.KODE} onChange={(e) => onInputChange(e, 'KODE')} required autoFocus />
                                </div>
                                <div className="field col-6 mb-2 lg:col-6">
                                    <label htmlFor="rekening">Rekening</label>
                                    <div className="p-inputgroup">
                                        <InputText id="rekening" readOnly value={bank.REKENING} onChange={(e) => onInputChange(e, 'REKENING')} />
                                        <Button icon="pi pi-search" className="p-button" onClick={btnRekening} />
                                    </div>
                                </div>
                                <div className="field col-6 mb-2 lg:col-6">
                                    <label className="mb-3">Penarikan Tunai</label>
                                    <div className="formgrid grid">
                                        <div className="field-radiobutton col-6">
                                            <RadioButton inputId="penarikantunai1" name="penarikantunai" value="Y" onChange={onPenarikanTunaiChange} checked={bank.PENARIKANTUNAI === 'Y'} />
                                            <label htmlFor="penarikantunai1">Ya</label>
                                        </div>
                                        <div className="field-radiobutton col-6">
                                            <RadioButton inputId="penarikantunai2" name="penarikantunai" value="T" onChange={onPenarikanTunaiChange} checked={bank.PENARIKANTUNAI !== 'Y'} />
                                            <label htmlFor="penarikantunai2">Tidak</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="field col-6 mb-2 lg:col-6">
                                    <label htmlFor="administrasi">Administrasi</label>
                                    <InputNumber
                                        id="administrasi"
                                        value={bank.ADMINISTRASI}
                                        onValueChange={(e) => onInputNumberChange(e, 'ADMINISTRASI')}
                                        inputStyle={{ textAlign: 'right' }}
                                    // mode="currency"
                                    // currency="IDR"
                                    // locale="id-ID"
                                    />
                                </div>
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label htmlFor="keterangan">Keterangan</label>
                                    <InputText disabled={edit} id="keterangan" value={bank.KETERANGAN} onChange={(e) => onInputChange(e, 'KETERANGAN')} />
                                </div>
                            </div>
                        </Dialog>

                        <MultipleRekeningCOA formField={activeFormField} setRekeningDialog={setRekeningDialog} onRowSelect={onRowSelectKode} rekeningDialog={rekeningDialog} />
                        <Dialog visible={deleteBankDialog} header="Confirm" modal footer={deleteBankDialogFooter} onHide={hideDeleteBankDialog}>
                            <div className="flex align-items-center justify-content-center">
                                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                                {bank && (
                                    <span>
                                        apakah kamu ingin menghapus  <strong>{bank.KODE}</strong>
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

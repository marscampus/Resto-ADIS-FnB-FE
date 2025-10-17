import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { TabPanel, TabView } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { classNames } from 'primereact/utils';
import React, { useEffect, useRef, useState } from 'react';
import Supplier from '../../../component/jenis_supplier';
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

export default function MasterSupplier() {
    // API READ
    const apiEndPointGet = '/api/supplier/get';
    // API DELETE
    const apiEndPointDelete = '/api/supplier/delete';
    // API STORE
    const apiEndPointStore = '/api/supplier/store';
    // API EDIT
    const apiEndPointUpdate = '/api/supplier/update';

    const toast = useRef(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [daftarSupplierDialog, setDaftarSupplierDialog] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [activeIndexSupplier, setActiveIndexSupplier] = useState(0);
    const [supplier, setSupplier] = useState([]);
    const [supplierTabel, setSupplierTabel] = useState(null);
    const [supplierTabelFilt, setSupplierTabelFilt] = useState(null);
    const [contactPerson1, setContactPerson1] = useState(null);
    const [deleteSupplierDialog, setDeleteSupplierDialog] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [search, setSearch] = useState('');
    const [data, setData] = useState(null);
    const [activeFormField, setActiveFormField] = useState(null);
    const fileName = `daftar-supplier-${new Date().toISOString().slice(0, 10)}`;
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
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
        setSupplierTabelFilt(supplierTabel);
    }, [supplierTabel, lazyState]);

    const loadLazyData = async () => {
        setLoading(true);
        try {
            const vaTable = await postData(apiEndPointGet, lazyState);
            const jsonSupplier = vaTable.data;
            setTotalRecords(jsonSupplier.total_data);
            setSupplierTabel(jsonSupplier.data);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };
    // ----------------------------------------------------------------------------------------------------------------- Hide Dialog
    const hideDialog = () => {
        setSubmitted(false);
        setDaftarSupplierDialog(false);
    };

    const hideDeleteSupplierDialog = () => {
        setDeleteSupplierDialog(false);
    };
    // ------------------------------------------------------------------------------------------------------------------ Toggle
    const toggleDataTableSupplier = async (event) => {
        // op.current.toggle(event);
        let indeks = null;
        let skipRequest = false;
        switch (event.index) {
            case 1:
                indeks = 2;
                contactPerson1 !== null ? (skipRequest = true) : '';
                break;
            case 2:
                indeks = 3;
                contactPerson1 !== null ? (skipRequest = true) : '';
                break;
            default:
                indeks = 1;
                data !== null ? (skipRequest = true) : '';
                break;
        }

        setActiveIndexSupplier(event.index ?? 0);
    };

    // -------------------------------------------------------------------------------------------------------------------- Dialog
    const openNew = () => {
        setSupplier([]);
        setDaftarSupplierDialog(true);
        setIsUpdateMode(false);
    };
    // -------------------------------------------------------------------------------------------------------------------- Func
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _supplier = { ...supplier };
        _supplier[`${name}`] = val;
        setSupplier(_supplier);
    };

    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        let _supplier = { ...supplier };
        _supplier[`${name}`] = val;
        setSupplier(_supplier);
    };

    const saveSupplier = async (e) => {
        try {
            let _supplierTabel = [...supplierTabel];
            let _supplier = { ...supplier };

            if (_supplier.NAMA == null) {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Nama Masih Kosong!', life: 3000 });
                return;
            }
            if (_supplier.ALAMAT == null) {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Alamat Masih Kosong!', life: 3000 });
                return;
            }
            if (_supplier.TELEPON == null) {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Telepon Masih Kosong!', life: 3000 });
                return;
            }
            let endPoint;
            if (isUpdateMode) {
                endPoint = apiEndPointUpdate;
            } else {
                endPoint = apiEndPointStore;
            }
            const vaTable = await postData(endPoint, _supplier);
            let data = vaTable.data;
            showSuccess(toast, data?.message)
            setSupplierTabel(_supplierTabel);
            setSupplier([]);
            loadLazyData();
            setDaftarSupplierDialog(false);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    const editSupplier = (supplier) => {
        setSupplier({ ...supplier });
        setDaftarSupplierDialog(true);
        setIsUpdateMode(true);
    };

    const confirmDeleteSupplier = (supplier) => {
        setSupplier(supplier);
        setDeleteSupplierDialog(true);
    };

    const deleteSupplier = async () => {
        try {
            let requestBody = {
                KODE: supplier.KODE
            };
            const vaDelete = await postData(apiEndPointDelete, requestBody);
            let data = vaDelete.data;
            showSuccess(toast, data?.message)
            setSupplier([]);
            setDeleteSupplierDialog(false);
            loadLazyData();
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (supplierTabel.length == 0 || !supplierTabel) {
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
            const supplierTabelPDF = supplierTabelFilt ? JSON.parse(JSON.stringify(supplierTabelFilt)) : [];

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

            if (!supplierTabelPDF || supplierTabelPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Master Daftar Supplier';
            const periodeLaporan = '';
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = supplierTabelPDF.map((item) => [item.KODE, item.NAMA, item.ALAMAT, item.TELEPON]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['KODE', 'NAMA', 'ALAMAT', 'TELEPON']],
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
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoadingPreview(false);
        }
    };

    // Yang Handle Excel
    const exportExcel = () => {
        exportToXLSX(supplierTabelFilt, 'master-daftar-supplier.xlsx');
    };

    // ---------------------------------------------------------------------------------------------------------------- Button
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew} />
                    {/* <Button label="Delete" icon="pi pi-trash" className="p-button-danger" onClick={confirmDeleteSelected} readOnly={!selectedsuppliers || !selectedsuppliers.length} /> */}
                </div>
            </React.Fragment>
        );
    };
    const supplierDialogFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveSupplier} />
        </>
    );
    const previewSupplier = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Preview" icon="pi pi-file-o" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnAdjust} />
                </div>
            </React.Fragment>
        );
    };
    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-pencil" severity="success" rounded className="mr-2" onClick={() => editSupplier(rowData)} />
                <Button icon="pi pi-trash" severity="warning" rounded onClick={() => confirmDeleteSupplier(rowData)} />
            </>
        );
    };

    const deleteSupplierDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={hideDeleteSupplierDialog} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deleteSupplier} />
        </>
    );

    // -----------------------------------------------------------------------------------------------------------------< Rekening >
    const [rekeningDialog, setRekeningDialog] = useState(false);
    const btnRekening = () => {
        setRekeningDialog(true);
    };

    const onRowSelectKode = (event) => {
        const selectedRow = event.data;
        setSupplier((prevSupplier) => ({
            ...prevSupplier,
            REKENING: selectedRow.kode,
            KETREKENING: selectedRow.keterangan
        }));
        setRekeningDialog(false);
    };


    // -----------------------------------------------------------------------------------------------------------------< Supplier >
    const [supplierDialog, setSupplierDialog] = useState(false);
    const btnSupplier = () => {
        setSupplierDialog(true);
    };

    const handleSupplierData = (supplierKode, supplierNama) => {
        setSupplier((prevSupplier) => ({
            ...prevSupplier,
            JENISSUPPLIER: supplierKode,
            KETJENISSUPPLIER: supplierNama
        }));
    };

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
            filtered = supplierTabel.filter((d) => (x ? x.test(d.KODE) || x.test(d.NAMA) || x.test(d.ALAMAT) || x.test(d.TELEPON) : []));
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = supplierTabel;
            } else {
                filtered = supplierTabel.filter((d) => (x ? x.test(d.KODE) : []));
            }
        }

        setSupplierTabelFilt(filtered);
    };
    // -------------------------------------------------------------------------------------------------------------------------- return view
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
                        <h4>Menu Daftar Supplier</h4>
                        <hr />
                        <Toast ref={toast} />
                        <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>
                        <DataTable
                            value={supplierTabelFilt}
                            lazy
                            dataKey="KODE"
                            paginator
                            rows={10}
                            className="datatable-responsive"
                            first={lazyState.first}
                            totalRecords={totalRecords}
                            onPage={onPage}
                            loading={loading}
                            size="small"
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                            header={headerSearch}
                            filters={lazyState.filters}
                        >
                            <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="ALAMAT" header="ALAMAT"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="TELEPON" header="TELEPON"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate}></Column>
                        </DataTable>
                        <Toolbar className="mb-4" left={previewSupplier}></Toolbar>

                        {/* Dialog Supplier  */}
                        <Dialog visible={daftarSupplierDialog} style={{ width: '75%' }} header={(isUpdateMode ? 'Ubah ' : 'Tambah ') + 'Daftar Supplier'} modal className="p-fluid" footer={supplierDialogFooter} onHide={hideDialog}>
                            <TabView activeIndex={activeIndexSupplier} onTabChange={toggleDataTableSupplier}>
                                <TabPanel header="Data" style={{ width: '100%' }}>
                                    <div>
                                        <div className="formgrid grid">
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="kode">Kode</label>
                                                <div className="p-inputgroup">
                                                    <InputText autoFocus readOnly={isUpdateMode} id="kode" value={supplier.KODE} onChange={(e) => onInputChange(e, 'KODE')} />
                                                </div>
                                            </div>
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="nama">Nama</label>
                                                <div className="p-inputgroup">
                                                    <InputText id="nama" value={supplier.NAMA} onChange={(e) => onInputChange(e, 'NAMA')} />
                                                </div>
                                            </div>
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="telepon">Telepon</label>
                                                <div className="p-inputgroup">
                                                    <InputText id="telepon" value={supplier.TELEPON} onChange={(e) => onInputChange(e, 'TELEPON')} />
                                                </div>
                                            </div>
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="alamat">Alamat</label>
                                                <div className="p-inputgroup">
                                                    <InputText id="alamat" value={supplier.ALAMAT} onChange={(e) => onInputChange(e, 'ALAMAT')} />
                                                </div>
                                            </div>
                                            <div className="field col-12 mb-2 lg:col-6">
                                                <label htmlFor="jenis-supplier">Jenis Supplier</label>
                                                <div className="p-inputgroup">
                                                    <InputText
                                                        id="jenisSupplierKode"
                                                        value={supplier.JENISSUPPLIER}
                                                        onChange={(e) => onInputChange(e, 'JENIS_USAHA')}
                                                        className={classNames({ 'p-invalid': submitted && !supplier.JENIS_USAHA })}
                                                    />
                                                    <Button icon="pi pi-search" className="p-button" onClick={btnSupplier} />
                                                    <InputText readOnly id="jenisSupplierKet" value={supplier.KETJENISSUPPLIER} />
                                                </div>
                                            </div>
                                            <div className="field col-12 mb-2 lg:col-6">
                                                <label htmlFor="rek-perkiraan">Rekening Perkiraan</label>
                                                <div className="p-inputgroup">
                                                    <InputText id="rekeningKode" value={supplier.REKENING} onChange={(e) => onInputChange(e, 'REKENING')} className={classNames({ 'p-invalid': submitted && !supplier.REKENING })} />
                                                    <Button icon="pi pi-search" className="p-button" onClick={btnRekening} />
                                                    <InputText readOnly id="rekeningKet" value={supplier.KETREKENING} />
                                                </div>
                                            </div>
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="plafond1">Plafond 1</label>
                                                <div className="p-inputgroup">
                                                    <InputNumber inputStyle={{ textAlign: 'right' }} id="plafond1" value={supplier.PLAFOND_1} onChange={(e) => onInputNumberChange(e, 'PLAFOND_1')} />
                                                </div>
                                            </div>
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="plafond2">Plafond 2</label>
                                                <div className="p-inputgroup">
                                                    <InputNumber inputStyle={{ textAlign: 'right' }} id="plafond1" value={supplier.PLAFOND_2} onChange={(e) => onInputNumberChange(e, 'PLAFOND_2')} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabPanel>
                                <TabPanel header="Contact Person 1" style={{ width: '100%' }}>
                                    <div>
                                        <div className="formgrid grid">
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="nama">Nama</label>
                                                <div className="p-inputgroup">
                                                    <InputText autoFocus id="nama" value={supplier.NAMA_CP_1} onChange={(e) => onInputChange(e, 'NAMA_CP_1')} />
                                                </div>
                                            </div>
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="email">Email</label>
                                                <div className="p-inputgroup">
                                                    <InputText id="email" value={supplier.EMAIL_CP_1} onChange={(e) => onInputChange(e, 'EMAIL_CP_1')} />
                                                </div>
                                            </div>
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="telepon">Telepon</label>
                                                <div className="p-inputgroup">
                                                    <InputText id="telepon" value={supplier.TELEPON_CP_1} onChange={(e) => onInputChange(e, 'TELEPON_CP_1')} />
                                                </div>
                                            </div>
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="no-ponsel">Nomor Ponsel</label>
                                                <div className="p-inputgroup">
                                                    <InputText id="no-ponsel" value={supplier.HP_CP_1} onChange={(e) => onInputChange(e, 'HP_CP_1')} />
                                                </div>
                                            </div>
                                            <div className="field col-12 mb-2 lg:col-12">
                                                <label htmlFor="alamat">Alamat</label>
                                                <br />
                                                <InputTextarea style={{ width: '100%' }} id="alamat" value={supplier.ALAMAT_CP_1} onChange={(e) => onInputChange(e, 'ALAMAT_CP_1')} />
                                            </div>
                                        </div>
                                    </div>
                                </TabPanel>
                                <TabPanel header="Contact Person 2" style={{ width: '100%' }}>
                                    <div>
                                        <div className="formgrid grid">
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="nama">Nama</label>
                                                <div className="p-inputgroup">
                                                    <InputText autoFocus id="nama" value={supplier.NAMA_CP_2} onChange={(e) => onInputChange(e, 'NAMA_CP_2')} />
                                                </div>
                                            </div>
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="email">Email</label>
                                                <div className="p-inputgroup">
                                                    <InputText id="email" value={supplier.EMAIL_CP_2} onChange={(e) => onInputChange(e, 'EMAIL_CP_2')} />
                                                </div>
                                            </div>
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="telepon">Telepon</label>
                                                <div className="p-inputgroup">
                                                    <InputText id="telepon" value={supplier.TELEPON_CP_2} onChange={(e) => onInputChange(e, 'TELEPON_CP_2')} />
                                                </div>
                                            </div>
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <label htmlFor="no-ponsel">Nomor Ponsel</label>
                                                <div className="p-inputgroup">
                                                    <InputText id="no-ponsel" value={supplier.HP_CP_2} onChange={(e) => onInputChange(e, 'HP_CP_2')} />
                                                </div>
                                            </div>
                                            <div className="field col-12 mb-2 lg:col-12">
                                                <label htmlFor="alamat">Alamat</label>
                                                <br />
                                                <InputTextarea style={{ width: '100%' }} id="alamat" value={supplier.ALAMAT_CP_2} onChange={(e) => onInputChange(e, 'ALAMAT_CP_2')} />
                                            </div>
                                        </div>
                                    </div>
                                </TabPanel>
                            </TabView>
                        </Dialog>
                        <Supplier supplierDialog={supplierDialog} setSupplierDialog={setSupplierDialog} btnSupplier={btnSupplier} handleSupplierData={handleSupplierData} />
                        <MultipleRekeningCOA formField={activeFormField} setRekeningDialog={setRekeningDialog} onRowSelect={onRowSelectKode} rekeningDialog={rekeningDialog} />
                        <Dialog visible={deleteSupplierDialog} header="Confirm" modal footer={deleteSupplierDialogFooter} onHide={hideDeleteSupplierDialog}>
                            <div className="flex align-items-center justify-content-center">
                                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                                {supplier && (
                                    <span>
                                        apakah kamu ingin menghapus  <strong>{supplier.KODE}</strong>
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

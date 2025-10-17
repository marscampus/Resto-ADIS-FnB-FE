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
import { Footer, HeaderLaporan, addPageInfo } from '../../../../component/exportPDF/exportPDF';
import { exportToXLSX } from '../../../../component/exportXLSX/exportXLSX';
import { getEmail, getUserName, showError } from '../../../../component/GeneralFunction/GeneralFunction';
import PDFViewer from '../../../../component/PDFViewer';
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
export default function MasterUangPecahan() {
    // API READ
    const apiEndPointGet = '/api/uang_pecahan/get';
    // API DELETE
    const apiEndPointDelete = '/api/uang_pecahan/delete';
    // API STORE
    const apiEndPointStore = '/api/uang_pecahan/store';
    // API EDIT
    const apiEndPointUpdate = '/api/uang_pecahan/update';

    const toast = useRef(null);
    const [uang, setUang] = useState([]);
    const [uangPecahan, setUangPecahan] = useState(null);
    const [uangPecahanFilt, setUangPecahanFilt] = useState(null);
    const [uangPecahanAll, setUangPecahanAll] = useState(null);
    const [uangDialog, setUangDialog] = useState(false);
    const [deleteUangDialog, setDeleteUangDialog] = useState(false);
    const [deleteUang2Dialog, setDeleteUang2Dialog] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [selectedUang2, setSelectedUang2] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [statusAction, setStatusAction] = useState(null);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const fileName = `uang-pecahan-${new Date().toISOString().slice(0, 10)}`;
    const [loadingPreview, setLoadingPreview] = useState(false);
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [orientation, setOrientation] = useState('portrait');
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
    const [pdfUrl, setPdfUrl] = useState('');
    const [search, setSearch] = useState('');
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    const statusBodyTemplate = (rowData) => {
        return rowData.STATUS == 0 ? 'Kertas' : 'Logam';
    };
    const op = useRef(null);

    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
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

    const loadLazyData = async () => {
        setLoading(true);
        let requestBody = { ...lazyState };
        try {
            const vaTable = await postData(apiEndPointGet, requestBody);
            const jsonUang = vaTable.data;
            setTotalRecords(jsonUang.total_data);
            setUangPecahan(jsonUang.data);
        } catch (error) {
            let e = error?.response?.data || error;
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: e?.message || 'Terjadi Kesalahan', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const openNew = () => {
        setUang([]);
        setSubmitted(false);
        setUangDialog(true);
        setStatusAction('store');
    };

    const hideDialog = () => {
        setSubmitted(false);
        setUangDialog(false);
    };

    const hideDeleteUangDialog = () => {
        setDeleteUangDialog(false);
    };
    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        let _uang = { ...uang };
        _uang[`${name}`] = val;

        setUang(_uang);
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _uang = { ...uang };
        // _uang[`${name}`] = val;
        _uang[name] = val;

        setUang(_uang);
    };

    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew} />
                    {/* <Button label="Delete" icon="pi pi-trash" className="p-button-danger" onClick={confirmDeleteSelected} readOnly={!selecteduangs || !selecteduangs.length} /> */}
                </div>
            </React.Fragment>
        );
    };

    const createDataObject = (_uang) => {
        const data = {
            KODE: uang.KODE,
            STATUS: uang.STATUS || 0,
            NOMINAL: uang.NOMINAL
        };
        return data;
    };
    const saveUang = async (e) => {
        e.preventDefault();
        let _uang = { ...uang };
        let _data = createDataObject(_uang);
        let endPoint;
        if (statusAction === 'update') {
            endPoint = apiEndPointUpdate;
        } else {
            endPoint = apiEndPointStore;
        }
        try {
            const vaTable = await postData(endPoint, _data);
            let data = vaTable.data;
            if (data.code === '200') {
                toast.current.show({ severity: 'success', summary: data.message, detail: 'Data Berhasil Tersimpan', life: 3000 });
                if (statusAction == 'update') {
                    // setUangPecahan(_uangPecahan);
                    refreshTabel();
                    setUang([]);
                } else {
                    refreshTabel();
                }
                setUangDialog(false);
            } else if (data.code === '409') {
                toast.current.show({ severity: 'error', summary: data.message, detail: 'Kode Tidak Boleh Sama', life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: data.message, detail: data.messageValidator, life: 3000 });
            }
            // return;
            // if (data.status === "success") {
            // 	toast.current.show({ severity: "success", summary: "Successful", detail: "Berhasil Menyimpan Data", life: 5000 });
            //     if (statusAction == 'update') {
            //         // setUangPecahan(_uangPecahan);
            //         refreshTabel();
            //         setUang([]);
            //     } else {
            //         refreshTabel();
            //     }
            //     setUangDialog(false);
            // } else {
            //     toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'error', life: 5000 });
            // }
        } catch (error) { }
    };

    const refreshTabel = () => {
        let getLazyState = { ...lazyState };
        setlazyState(getLazyState);
    };

    const findIndexById = (KODE) => {
        let index = -1;
        for (let i = 0; i < uangPecahan.length; i++) {
            if (uangPecahan[i].KODE === KODE) {
                index = i;
                break;
            }
        }
        return index;
    };

    const confirmDeleteUang = (uang) => {
        setUang(uang);
        setDeleteUangDialog(true);
    };

    const deleteUang = async () => {
        let requestBody = {
            KODE: uang.KODE
        };
        const vaTable = await postData(apiEndPointDelete, requestBody);
        let data = vaTable.data;
        if (data.code === '200') {
            toast.current.show({ severity: 'success', summary: data.message, detail: 'Data Berhasil Dihapus', life: 3000 });
            setDeleteUangDialog(false);
            refreshTabel();
        } else {
            toast.current.show({ severity: 'error', summary: data.message, detail: 'Kesalahan Proses', life: 3000 });
        }
        // if (data.status == 'success') {
        //     toast.current.show({ severity: 'success', summary: 'Successful', detail: 'delected success', life: 5000 });
        //     setDeleteUangDialog(false);
        //     refreshTabel();
        // } else {
        //     toast.current.show({ severity: 'error', summary: 'Error', detail: 'deleted error', life: 5000 });
        // }
    };

    const editUang = (uang) => {
        setUang({ ...uang });
        setUangDialog(true);
        setStatusAction('update');
        setChecked(uang.STATUS);
    };

    const uangDialogFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveUang} />
        </>
    );

    const deleteUangDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={hideDeleteUangDialog} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deleteUang} />
        </>
    );

    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-pencil" severity="success" rounded className="mr-2" onClick={() => editUang(rowData)} />
                <Button icon="pi pi-trash" severity="warning" rounded onClick={() => confirmDeleteUang(rowData)} />
            </>
        );
    };

    const allData = async () => {
        const vaData = await postData(apiEndPointGet);
        const data = vaData.data;
        setUangPecahanAll(data);
    };

    const [checked, setChecked] = useState('0');
    const handleRadioChange = (value) => {
        setChecked(value);
        setUang((prevUang) => ({ ...prevUang, STATUS: value }));
    };

    useEffect(() => {
        setUangPecahanFilt(uangPecahan);
    }, [uangPecahan, lazyState]);

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = uangPecahan.filter((d) => (x ? x.test(d.KODE) || x.test(d.NOMINAL) : []));
            setSearch(searchVal);
        }

        setUangPecahanFilt(filtered);
    };

    const dropdownValues = [
        { name: 'KODE', label: 'KODE' },
        // { name: 'STATUS', label: 'STATUS' },
        { name: 'NOMINAL', label: 'NOMINAL' }
    ];
    const [defaultOption, setDropdownValue] = useState(null);
    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup">
                    {/* <Calendar name="startDate" value={startDate} onChange={handleStartDateChange} placeholder="Start Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                    <Calendar name="endDate" value={endDate} onChange={handleEndDateChange} placeholder="End Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                    <Button label="" icon="pi pi-refresh" className="p-button-primary mr-2" onClick={refresh}/> */}
                </div>
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => filterPlugins('search', e.target.value)} placeholder="Search..." value={search} />
                </span>
            </div>
        </div>
    );
    const onSearch = (value) => {
        let _lazyState = { ...lazyState };
        _lazyState['filters'] = {};
        if (defaultOption != null && defaultOption.label != null) {
            _lazyState['filters'][defaultOption.label] = value;
        }
        onPage(_lazyState);
    };
    const onSearchgtw = (value) => {
        let _lazyState = { ...lazyState };
        if (defaultOption != null && defaultOption.label != null) {
            if (defaultOption.label === 'STATUS') {
                // Mengatur nilai yang dikirim ke backend berdasarkan pilihan dropdown 'STATUS'
                if (value === 'kertas') {
                    _lazyState['filters'][defaultOption.label] = 0;
                } else if (value === 'logam') {
                    _lazyState['filters'][defaultOption.label] = 1;
                }
            } else {
                _lazyState['filters'][defaultOption.label] = value;
            }
            // _lazyState.filters[defaultOption.name] = value;
        }
        onPage(_lazyState); // Ganti onPage dengan fungsi yang benar untuk mengirim ke backend
    };

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (uangPecahan.length == 0 || !uangPecahan) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong', life: 3000 });
            return;
        }
        allData();
        setAdjustDialog(true);
    };

    const handleAdjust = async (dataAdjust) => {
        exportPDF(dataAdjust);
    };

    const exportPDF = async (dataAdjust) => {
        setLoadingPreview(true);
        try {
            const uangPecahanPDF = uangPecahanFilt ? JSON.parse(JSON.stringify(uangPecahanFilt)) : [];

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

            if (!uangPecahanPDF || uangPecahanPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Master Uang Pecahan';
            const periodeLaporan = '';
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = uangPecahanPDF.map((item) => [item.KODE, item.STATUS === '0' ? 'Kertas' : 'Logam', parseInt(item.NOMINAL).toLocaleString()]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['KODE', 'STATUS', 'NOMINAL']],
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
                    2: { halign: 'right' }
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
        exportToXLSX(uangPecahanFilt, 'master-uang-pecahan.xlsx');
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
                        <h4>Menu Uang Pecahan</h4>
                        <hr />
                        <Toast ref={toast} />
                        <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>

                        <DataTable
                            value={uangPecahanFilt}
                            size="small"
                            dataKey="KODE"
                            showGridlines
                            paginator
                            className="datatable-responsive"
                            totalRecords={totalRecords}
                            loading={loading}
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                            header={headerSearch}
                            filters={lazyState.filters}
                            first={first} // Menggunakan nilai halaman pertama dari state
                            rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                            onPage={onPage}
                            emptyMessage="Data Kosong"
                        >
                            <Column field="KODE" header="KODE" alignHeader={'center'}></Column>
                            <Column field="STATUS" header="STATUS" alignHeader={'center'} body={statusBodyTemplate}></Column>
                            <Column
                                field="NOMINAL"
                                body={(rowData) => {
                                    const value = rowData.NOMINAL ? parseInt(rowData.NOMINAL).toLocaleString() : 0;
                                    return value;
                                }}
                                alignHeader={'center'}
                                header="NOMINAL"
                                style={{ textAlign: 'right' }}
                            ></Column>
                            <Column header="ACTION" body={actionBodyTemplate}></Column>
                        </DataTable>
                        <Toolbar className="mb-4" left={preview}></Toolbar>
                        <Dialog visible={uangDialog} style={{ width: '75%' }} header="Form Uang Pecahan" modal className="p-fluid" footer={uangDialogFooter} onHide={hideDialog}>
                            <div className="field">
                                <label htmlFor="kode">Kode</label>
                                <InputText id="kode" value={uang.KODE} onChange={(e) => onInputChange(e, 'KODE')} readOnly={statusAction === 'update'} required autoFocus />
                            </div>
                            <div className="field">
                                <label className="mb-3">Status</label>
                                <div className="formgrid grid">
                                    <div className="field-radiobutton col-6">
                                        <RadioButton inputId="status_kertas" name="status" value="0" onChange={() => handleRadioChange('0')} checked={checked === '0'} />
                                        <label htmlFor="status_kertas">Kertas</label>
                                    </div>
                                    <div className="field-radiobutton col-6">
                                        <RadioButton inputId="status_koin" name="status" value="1" onChange={() => handleRadioChange('1')} checked={checked === '1'} />
                                        <label htmlFor="status_koin">Logam</label>
                                    </div>
                                </div>
                            </div>
                            <div className="field">
                                <label htmlFor="nominal">Nominal</label>
                                <InputNumber
                                    id="nominal"
                                    value={uang.NOMINAL}
                                    onChange={(e) => onInputNumberChange(e, 'NOMINAL')}
                                    // mode="currency"
                                    // currency="IDR"
                                    // locale="id-ID"
                                    inputStyle={{ textAlign: 'right' }}
                                />
                            </div>
                        </Dialog>

                        <Dialog visible={deleteUangDialog} header="Confirm" modal footer={deleteUangDialogFooter} onHide={hideDeleteUangDialog}>
                            <div className="flex align-items-center justify-content-center">
                                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                                {uang && (
                                    <span>
                                        Are you sure you want to delete <strong>{uang.KODE}</strong>
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

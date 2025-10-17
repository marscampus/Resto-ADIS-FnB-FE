/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { classNames } from 'primereact/utils';
import React, { useEffect, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import postData from '../../../lib/Axios';
import { getUserName, getEmail } from '../../../component/GeneralFunction/GeneralFunction';
import { exportToXLSX } from '../../../component/exportXLSX/exportXLSX';
import { addPageInfo, Footer, HeaderLaporan } from '../../../component/exportPDF/exportPDF';
import AdjustPrintMarginLaporan from '../../component/adjustPrintMarginLaporan';
import { getSessionServerSide } from '../../../utilities/servertool';
import PDFViewer from '../../../component/PDFViewer';
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
const ServicePage = () => {
    let emptyService = {
        KODE: '',
        KETERANGAN: '',
        ESTIMASIHARGA: 0
    };

    const apiEndPointGet = '/api/service/jasa/data';
    const apiEndPointStore = '/api/service/jasa/store';
    const apiEndPointUpd = '/api/service/jasa/update';
    const apiEndPointDelete = '/api/service/jasa/delete';

    const [services, setServices] = useState([]);
    const [servicesFilt, setServicesFilt] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [serviceDialog, setServiceDialog] = useState(false);
    const [deleteServiceDialog, setDeleteServiceDialog] = useState(false);
    const [deleteServicesDialog, setDeleteServicesDialog] = useState(false);
    const [service, setService] = useState(emptyService);
    const [selectedServices, setSelectedServices] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [dataLoaded, setDataLoaded] = useState(false);
    const toast = useRef(null);
    const dt = useRef(null);
    const [errors, setErrors] = useState({});
    const [isNewRecord, setIsNewRecord] = useState(true);
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [search, setSearch] = useState('');
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [orientation, setOrientation] = useState('portrait');
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
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
        loadServices();
    };

    useEffect(() => {
        loadServices();
    }, []);

    useEffect(() => {
        setServicesFilt(services);
    }, [services, lazyState]);

    const loadServices = async () => {
        setLoading(true);
        try {
            const data = await postData(apiEndPointGet, lazyState);
            setServices(data.data.data);
            setTotalRecords(data.data.total_data);
            setDataLoaded(true);
        } catch (error) {
            console.error('Error loading services:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Gagal memuat data Jasa', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const openNew = () => {
        setService(emptyService);
        setSubmitted(false);
        setIsNewRecord(true);
        setServiceDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setServiceDialog(false);
    };

    const hideDeleteServiceDialog = () => {
        setDeleteServiceDialog(false);
    };

    const hideDeleteServicesDialog = () => {
        setDeleteServicesDialog(false);
    };

    const saveService = async () => {
        setSubmitted(true);
        if (service.KODE.trim()) {
            let response;
            try {
                let endPoint;
                if (isNewRecord) {
                    endPoint = apiEndPointStore;
                } else {
                    endPoint = apiEndPointUpd;
                }
                const vaData = await postData(endPoint, service);
                let data = vaData.data;
                if (data.code === '200') {
                    loadServices();
                    setServiceDialog(false);
                    setService(emptyService);
                    toast.current?.show({ severity: 'success', summary: 'Successful', detail: `Berhasil ${service.KODE ? 'memperbarui' : 'menambahkan'} jasa`, life: 3000 });
                } else if (data.code === '409') {
                    toast.current.show({ severity: 'error', summary: data.message, detail: 'Kode Tidak Boleh Sama', life: 3000 });
                } else {
                    toast.current.show({ severity: 'error', summary: data.message, detail: data.messageValidator, life: 3000 });
                }
            } catch (error) {
                console.error('Error saving service:', error);
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Terjadi kesalahan dalam menyimpan jasa', life: 3000 });
            }
        }
    };

    const editService = (service) => {
        setService({ ...service });
        setIsNewRecord(false);
        setServiceDialog(true);
    };

    const confirmDeleteService = (service) => {
        setService(service);
        setDeleteServiceDialog(true);
    };

    const deleteService = async () => {
        try {
            let requestBody = {
                KODE: service.KODE
            };
            const vaData = await postData(apiEndPointDelete, requestBody);
            let data = vaData.data;
            if (data.code === '200') {
                loadServices();
                setDeleteServiceDialog(false);
                setService(emptyService);
                toast.current?.show({ severity: 'success', summary: 'Successful', detail: 'Berhasil menghapus jasa', life: 3000 });
            } else {
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Terjadi kesalahan dalam menghapus jasa', life: 3000 });
            }
        } catch (error) {
            console.error('Error deleting service:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Terjadi kesalahan dalam menghapus jasa', life: 3000 });
        }
    };

    const deleteSelectedServices = async () => {
        try {
            if (selectedServices) {
                await ServiceAPI.bulkDelete(selectedServices.map((p) => p.KODE));
            }
            loadServices();
            setDeleteServicesDialog(false);
            setSelectedServices([]);
            toast.current?.show({ severity: 'success', summary: 'Successful', detail: 'Berhasil menghapus jasa', life: 3000 });
        } catch (error) {
            console.error('Error deleting services:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Terjadi kesalahan dalam menghapus jasa', life: 3000 });
        }
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _service = { ...service, [name]: val };
        setService(_service);
    };

    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        let _service = { ...service, [name]: val };
        setService(_service);
    };

    const onGlobalFilterChange = (e) => {
        setGlobalFilter(e.target.value);
    };

    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew} />
                </div>
            </React.Fragment>
        );
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-pencil" rounded severity="success" className="mr-2" onClick={() => editService(rowData)} />
                <Button icon="pi pi-trash" rounded severity="warning" onClick={() => confirmDeleteService(rowData)} />
            </>
        );
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText placeholder="Search" value={search} onChange={(e) => filterPlugins('search', e.target.value)} className="w-full" />
            </span>
        </div>
    );

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = services.filter((d) => (x ? x.test(d.KODE) || x.test(d.KETERANGAN) || x.test(d.ESTIMASIHARGA) : []));
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = services;
            } else {
                filtered = services.filter((d) => (x ? x.test(d.KodeDiskon) : []));
            }
        }
        console.log(filtered);

        setServicesFilt(filtered);
    };

    const serviceDialogFooter = (
        <>
            <Button label="Batal" icon="pi pi-times" text onClick={hideDialog} />
            <Button label="Simpan" icon="pi pi-check" text onClick={saveService} />
        </>
    );

    const deleteServiceDialogFooter = (
        <>
            <Button label="Batal" icon="pi pi-times" text onClick={hideDeleteServiceDialog} />
            <Button label="Ya" icon="pi pi-check" text onClick={deleteService} />
        </>
    );

    const deleteServicesDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" text onClick={hideDeleteServicesDialog} />
            <Button label="Ya" icon="pi pi-check" text onClick={deleteSelectedServices} />
        </>
    );

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (services.length == 0 || !services) {
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
            console.log(services);
            const jasaPDF = services ? JSON.parse(JSON.stringify(services)) : [];
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

            if (!jasaPDF || jasaPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Master Jasa';
            const periodeLaporan = '';
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = jasaPDF.map((item) => [item.KODE, item.KETERANGAN, parseInt(item.ESTIMASIHARGA).toLocaleString()]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['KODE.', 'KETERANGAN', 'ESTIMASIHARGA']],
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
        exportToXLSX(services, 'master-jasa.xlsx');
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
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>Menu Jasa</h4>
                    <hr></hr>
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>
                    <DataTable
                        value={servicesFilt}
                        paginator
                        className="datatable-responsive"
                        totalRecords={totalRecords}
                        loading={loading}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                        size="small"
                        header={header}
                        filters={lazyState.filters}
                        first={first} // Menggunakan nilai halaman pertama dari state
                        rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                        onPage={onPage}
                        emptyMessage="Data Kosong"
                    >
                        <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN"></Column>
                        <Column
                            headerStyle={{ textAlign: 'center' }}
                            field="ESTIMASIHARGA"
                            body={(rowData) => {
                                const value = rowData.ESTIMASIHARGA ? parseInt(rowData.ESTIMASIHARGA).toLocaleString() : 0;
                                return value;
                            }}
                            style={{ textAlign: 'right' }}
                            header="ESTIMASIHARGA"
                        ></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field={actionBodyTemplate} header="ACTION"></Column>
                    </DataTable>
                    <Toolbar className="mb-4" left={preview}></Toolbar>
                    {/* DIALOG */}
                    <Dialog visible={serviceDialog} style={{ width: '450px' }} header="Detail Jasa" modal className="p-fluid" footer={serviceDialogFooter} onHide={hideDialog}>
                        <div className="field">
                            <label htmlFor="kode">Kode</label>
                            <InputText
                                disabled={!isNewRecord}
                                id="kode"
                                value={service.KODE}
                                onChange={(e) => onInputChange(e, 'KODE')}
                                required
                                autoFocus
                                className={classNames({
                                    'p-invalid': submitted && !service.KODE
                                })}
                            />
                            {submitted && !service.KODE && <small className="p-error">Kode wajib diisi.</small>}
                        </div>
                        <div className="field">
                            <label htmlFor="keterangan">Keterangan</label>
                            <InputTextarea id="keterangan" value={service.KETERANGAN} onChange={(e) => onInputChange(e, 'KETERANGAN')} required rows={3} cols={20} />
                        </div>

                        <div className="formgrid grid">
                            <div className="field col">
                                <label htmlFor="harga">Estimasi Harga</label>
                                <InputNumber id="harga" value={service.ESTIMASIHARGA} onValueChange={(e) => onInputNumberChange(e, 'ESTIMASIHARGA')} inputStyle={{ textAlign: 'right' }} />
                            </div>
                        </div>
                    </Dialog>

                    <Dialog visible={deleteServiceDialog} style={{ width: '450px' }} header="Confirm" modal footer={deleteServiceDialogFooter} onHide={hideDeleteServiceDialog}>
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {service && (
                                <span>
                                    Apakah Anda yakin ingin menghapus jasa <b>{service.KODE}</b>?
                                </span>
                            )}
                        </div>
                    </Dialog>

                    <Dialog visible={deleteServicesDialog} style={{ width: '450px' }} header="Confirm" modal footer={deleteServicesDialogFooter} onHide={hideDeleteServicesDialog}>
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {service && <span>Apakah Anda yakin ingin menghapus jasa yang dipilih?</span>}
                        </div>
                    </Dialog>
                </div>
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

export default ServicePage;

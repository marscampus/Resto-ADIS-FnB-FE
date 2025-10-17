import axios from 'axios';
import getConfig from 'next/config';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { FileUpload } from 'primereact/fileupload';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { RadioButton } from 'primereact/radiobutton';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { classNames } from 'primereact/utils';
import React, { lazy, useEffect, useRef, useState } from 'react';
import { OverlayPanel } from 'primereact/overlaypanel';
import { TabView, TabPanel } from 'primereact/tabview';
import { Skeleton } from 'primereact/skeleton';
import TabelSkaleton from '../../../../component/tabel/skaleton';
import { Paginator } from 'primereact/paginator';
import { BreadCrumb } from 'primereact/breadcrumb';

import postData from "../../../../lib/Axios";
import { getSessionServerSide } from "../../../../utilities/servertool";
export async function getServerSideProps(context) {
  const sessionData = await getSessionServerSide(context, context.resolvedUrl);
  if (sessionData?.redirect) {
    return sessionData;
  }
  return {
    props: {},
  };
}
export default function MasterBanner() {
    const breadcrumbHome = { icon: 'pi pi-home', to: '/' };
    const breadcrumbItems = [{ label: 'Master' }, { label: 'Info Kasir' }, { label: 'Banner', to: '#' }];
    // PATH API
    const apiDirPath = '/api/api_crud_kode/';
    // API READ
    const apiEndPointGet = '/api/banner_kasir/get';
    // API DELETE
    const apiEndPointDelete = '/api/banner_kasir/delete';
    // API STORE
    const apiEndPointStore = '/api/banner_kasir/store';
    // API EDIT
    const apiEndPointUpdate = '/api/banner_kasir/update';
    let emptybanner = {
        KODE: null,
        KETERANGAN: null,
        BANNER: null
    };

    const toast = useRef(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedCoa, setSelectedCoa] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [banner, setBanner] = useState(emptybanner);
    const [bannerDialog, setBannerDialog] = useState(false);
    const [bannerTabel, setBannerTabel] = useState(null);

    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    const itemsSkelaton = Array.from({ length: 2 }, (v, i) => i);
    const columns = [
        { field: 'KODE', header: 'KODE' },
        { field: 'KETERANGAN', header: 'KETERANGAN' },
        { field: 'BANNER', header: 'BANNER' }
    ];

    const op = useRef(null);

    const onPage = (event) => {
        setlazyState(event);
    };

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    const refreshTabel = () => {
        let getLazyState = { ...lazyState };
        setlazyState(getLazyState);
    };

    const loadLazyData = async () => {
        setLoading(true);
        try {
            const header = {
                'Content-Type': 'application/json;charset=UTF-8',
                'X-ENDPOINT': apiEndPointGet
            };
            // const vaTable = await axios.post(apiDirPath, lazyState, { headers: header });
            const vaTable = await postData(apiEndPointGet, lazyState);
            const jsonBanner = vaTable.data;
            setTotalRecords(jsonBanner.total);
            setBannerTabel(jsonBanner.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };
    // ----------------------------------------------------------------------------------------------------------------- Hide Dialog
    const hideDialog = () => {
        setSubmitted(false);
        setBannerDialog(false);
    };

    // -------------------------------------------------------------------------------------------------------------------- Dialog
    const openNew = () => {
        // setCustomer(emptycustomer);
        setSubmitted(false);
        setBannerDialog(true);
        // setStatusAction('store');
    };

    // -------------------------------------------------------------------------------------------------------------------- Func
    const saveBanner = async (e) => {
        e.preventDefault();
    };
    const onUpload = () => {
        toast.current.show({ severity: 'info', summary: 'Success', detail: 'File Uploaded', life: 3000 });
    };
    // ---------------------------------------------------------------------------------------------------------------- Button
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
    const bannerDialogFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveBanner} />
        </>
    );

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <BreadCrumb home={breadcrumbHome} model={breadcrumbItems} style={{ background: 'none', border: 'none' }} />
                <div className="card">
                    <h4>Menu Banner</h4>
                    <hr />
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>
                    <DataTable value={bannerTabel} size="small" lazy dataKey="KODE" paginator rows={10} className="datatable-responsive" first={lazyState.first} totalRecords={totalRecords} onPage={onPage} loading={loading}>
                        <Column headerStyle={{ textAlign: "center" }} field="KODE" header="KODE"></Column>
                        <Column headerStyle={{ textAlign: "center" }} field="KETERANGAN" header="KETERANGAN"></Column>
                        <Column headerStyle={{ textAlign: "center" }} field="BANNER" header="BANNER"></Column>
                        {/* <Column headerStyle={{ textAlign: "center" }} header="ACTION" body={actionBodyTemplate}></Column> */}
                    </DataTable>

                    {/* Dialog Banner  */}
                    <Dialog visible={bannerDialog} style={{ width: '75%' }} header="Tambah Banner " modal className="p-fluid" footer={bannerDialogFooter} onHide={hideDialog}>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="kode">Kode</label>
                                <div className="p-inputgroup">
                                    <InputText disabled id="kode" value={banner.KODE} onChange={(e) => onInputChange(e, 'KODE')} className={classNames({ 'p-invalid': submitted && !banner.KODE })} />
                                </div>
                                {submitted && !banner.KODE && <small className="p-invalid">Kode is required.</small>}
                            </div>
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="keterangan">Keterangan</label>
                                <InputText id="keterangan" value={banner.Keterangan} onChange={(e) => onInputChange(e, 'Keterangan')} required autoFocus className={classNames({ 'p-invalid': submitted && !banner.Keterangan })} />
                                {submitted && !banner.KETERANGAN && <small className="p-invalid">Keterangan is required.</small>}
                            </div>
                            <div class="grid formgrid">
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label htmlFor="">Upload Gambar :</label>
                                    <FileUpload style={{ marginLeft: '20px' }} mode="basic" name="demo[]" url="/api/upload" accept="image/*" maxFileSize={1000000} onUpload={onUpload} />
                                </div>
                            </div>
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}

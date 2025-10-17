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
import React, { useEffect, useRef, useState } from 'react';
import { OverlayPanel } from 'primereact/overlaypanel';
import { TabView, TabPanel } from 'primereact/tabview';
import { Skeleton } from 'primereact/skeleton';
import TabelSkaleton from '../../../../component/tabel/skaleton';
import { Paginator } from 'primereact/paginator';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Calendar } from 'primereact/calendar';

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
export default function Mastersetupkasir(){
    const breadcrumbHome = { icon: 'pi pi-home', to: '/' };
    const breadcrumbItems = [{ label: 'Master' }, { label: 'Info Kasir' }, { label: 'Setup Info Kasir', to:'#' }];

    let emptysetupkasir = {
        KODE:null,
    };

    const toast = useRef(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedCoa, setSelectedCoa] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [setupKasir, setSetupKasir] = useState(emptysetupkasir);

    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {

        }
    });
    const itemsSkelaton = Array.from({ length: 2 }, (v, i) => i);
    const columns = [
        { field:'KODE',header: 'KODE'},
    ];

    const op = useRef(null);

    const onPage = (event) => {
        setlazyState(event);
    };

    useEffect(()=>{
        loadLazyData();
    },[lazyState]);

    const refreshTabel = ()=>{
        let getLazyState = {...lazyState};
        setlazyState(getLazyState);
    }

    const loadLazyData = async () => {
        setLoading(true);
        // const dataBank = await fetch('/api/bank',{
        //     method:"POST",
        //     headers:{ "Content-Type": "application/json","X-ACTION":"get" },
        //     body:JSON.stringify(lazyState)
        // }).then((result)=> result.text())
        // .then((body)=>{return body });
        // const jsonBank = JSON.parse(dataBank);
        // setTotalRecords(jsonBank.total);
        // setCoa(jsonBank.data);
        setLoading(false);
    }

    // -------------------------------------------------------------------------------------------------------------------- Dialog
    const openNew = () => {
        // setCustomer(emptycustomer);
        setSubmitted(false);
        setSetupKasirDialog(true);
        // setStatusAction('store');
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
    const buttonFooter = (
        <>
            {/* <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} /> */}
            <Button label="Save" icon="pi pi-check" className="p-button-text" />
        </>
    );


    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <BreadCrumb home={breadcrumbHome} model={breadcrumbItems} style={{ background: 'none', border: 'none' }} />
                <div className="card">
                    <h4>Menu Setup Info Kasir</h4><hr/>
                    <Toast ref={toast} />
                    <div class="grid formgrid">
                        <div className="field col-12 mb-2 lg:col-12">
                            <label htmlFor="info-kasir">Info Kasir</label><br/>
                            <InputTextarea style={{width:'100%'}} id="info-kasir" value={setupKasir.INFOKASIR} onChange={(e) => onInputChange(e, 'INFOKASIR')} required autoFocus className={classNames({ 'p-invalid': submitted && !setupKasir.INFOKASIR })} />
                            {submitted && !setupKasir.INFOKASIR && <small className="p-invalid">Info Kasir is required.</small>}
                        </div>
                    </div>
                    <div class="grid formgrid">
                        <div className="field col-12 mb-2 lg:col-6">
                            <label htmlFor="no-pengaduan">No Pengaduan</label><br/>
                            <InputText style={{width:'100%'}} id="no-pengaduan" value={setupKasir.NOPENGADUAN} onChange={(e) => onInputChange(e, 'NOPENGADUAN')} required autoFocus className={classNames({ 'p-invalid': submitted && !setupKasir.NOPENGADUAN })} />
                            {submitted && !setupKasir.NOPENGADUAN && <small className="p-invalid">No Pengaduan is required.</small>}
                        </div>
                        <div className="field col-12 mb-2 lg:col-6">
                            <label htmlFor="link-video">Link Video</label><br/>
                            <InputText style={{width:'100%'}} id="link-video" value={setupKasir.LINKVIDEO} onChange={(e) => onInputChange(e, 'LINKVIDEO')} required autoFocus className={classNames({ 'p-invalid': submitted && !setupKasir.LINKVIDEO })} />
                            {submitted && !setupKasir.LINKVIDEO && <small className="p-invalid">No Pengaduan is required.</small>}
                        </div>
                    </div>
                    <br/>
                    <Toolbar className="mb-4" right={buttonFooter}></Toolbar>
                </div>
            </div>
        </div>
    )

}

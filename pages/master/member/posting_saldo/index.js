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
export default function Masterpostingsaldo(){
    const breadcrumbHome = { icon: 'pi pi-home', to: '/' };
    const breadcrumbItems = [{ label: 'Master' }, { label: 'Customer' }, { label: 'Posting Saldo Customer', to:'#' }];

    let emptypostingsaldo = {
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
    const [postingSaldo, setPostingSaldo] = useState(emptypostingsaldo);

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
        setPostingSaldoDialog(true);
        // setStatusAction('store');
    };
    // ---------------------------------------------------------------------------------------------------------------- Button
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew} />
                    {/* <Button label="Delete" icon="pi pi-trash" className="p-button-danger" onClick={confirmDeleteSelected} readOnly={!selectedbanks || !selectedbanks.length} /> */}
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
                    <h4>Menu Posting Saldo Customer</h4><hr/>
                    <Toast ref={toast} />
                    <div class="grid formgrid">
                        <div className="field col-12 mb-2 lg:col-6">
                            <div className="p-field">
                                <label htmlFor="tglPosting">Tanggal Posting</label>
                                <Calendar
                                    id="tgl-posting"
                                    value={postingSaldo.TGLPOSTING}
                                    style={{width:'100%',marginTop:'5px'}}
                                    showIcon
                                    dateFormat="dd-mm-yy"
                                />
                            </div>
                            {submitted && !postingSaldo.TGLPOSTING && <small className="p-invalid">Tanggal Posting is required.</small>}
                        </div>
                        <div className="field col-12 mb-2 lg:col-6">
                            <label htmlFor="nominal">Nominal</label><br/>
                            <InputNumber style={{width:'100%'}} id="nominal" value={postingSaldo.DISKON} onChange={(e) => onInputChange(e, 'DISKON')} required autoFocus className={classNames({ 'p-invalid': submitted && !postingSaldo.DISKON })} />
                            {submitted && !postingSaldo.DISKON && <small className="p-invalid">Nominal is required.</small>}
                        </div>
                    </div><br/>
                    <Toolbar className="mb-4" right={buttonFooter}></Toolbar>
                </div>
            </div>
        </div>
    )

}

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
import TabelSkaleton from '../../../component/tabel/skaleton';
import { Paginator } from 'primereact/paginator';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { useRouter } from 'next/router';

export default function MasterPelunasanPiutang(){
    const breadcrumbHome = { icon: 'pi pi-home', to: '/' };
    const breadcrumbItems = [{ label: 'Pembelian' }, { label: 'Pelunasan Piutang', to:'#' }];

    let emptypelunasanpiutang = {
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
    const [pelunasanPiutang, setPelunasanPiutang] = useState(emptypelunasanpiutang);
    const [pelunasanPiutangDialog, setPelunasanPiutangDialog] = useState(false);
    const [dates, setDates] = useState(null);
    const [defaultOption, setDropdownValue] = useState(null);
    const [statusAction, setStatusAction] = useState(null);

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
    // ----------------------------------------------------------------------------------------------------------------- Hide Dialog
    const hideDialog = () => {
        setSubmitted(false);
        setPelunasanPiutangDialog(false);
    };

    // -------------------------------------------------------------------------------------------------------------------- Dialog
    const router = useRouter();
    const openNew = () => {
        setPelunasanPiutang(emptypelunasanpiutang);
        setSubmitted(false);
        router.push('/penjualan/pelunasan-piutang/add');
        setStatusAction('store');
    };

    // -------------------------------------------------------------------------------------------------------------------- Func
    const savePelunasanPiutang = async (e)=>{
        e.preventDefault();
    }

    // ---------------------------------------------------------------------------------------------------------------- Button
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2" style={{ display: 'flex', alignItems: 'center' }}>
                    <Button label="New" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew} />
                </div>
            </React.Fragment>
        );
    };
    const rightToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2" style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="field">
                        {/* <label>Range Tanggal</label> */}
                        <div className="p-inputgroup">
                            <Calendar value={dates} onChange={(e) => setDates(e.value)} selectionMode="range" placeholder='Range Tanggal' readOnlyInput />
                            <Button label="Refresh" icon="pi pi-refresh" className="p-button-primary mr-2" />
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    };
    const pelunasanPiutangDialogFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={savePelunasanPiutang} />
        </>
    );

    const preview = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Preview" outlined className="p-button-secondary p-button-sm mr-2" />
                </div>
            </React.Fragment>
        );
    };

    // ----------------------------------------------------------------------------------------------------------------------------------------------------- search
    const dropdownValues = [
        { name: 'KODE', label: 'KODE' },
        { name: 'KETERANGAN', label: 'KETERANGAN' }
    ];
    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
          <h5 className="m-0"></h5>
          <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="name" placeholder="Pilih kolom" />
            <span className="block mt-2 md:mt-0 p-input-icon-left">
              <i className="pi pi-search" />
              <InputText type="search" onInput={(e) => onSearch(e.target.value)} placeholder="Search..." />
            </span>
          </div>
        </div>
      );

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <BreadCrumb home={breadcrumbHome} model={breadcrumbItems} style={{ background: 'none', border: 'none' }} />
                <div className="card">
                    <h4>Menu Pelunasan Piutang</h4><hr/>
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>
                    <DataTable
                        // value={pelunasanPiutang}
                        lazy
                        // dataKey="KODE"
                        // paginator
                        rows={10}
                        className='datatable-responsive'
                        first={lazyState.first}
                        totalRecords={totalRecords}
                        onPage={onPage}
                        loading={loading}
                        // paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        // currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                        header={headerSearch}
                        // filters={lazyState.filters}
                        // emptyMessage="Data Kosong"
                    >
                        <Column headerStyle={{ textAlign: "center" }} field="FAKTUR" header="FAKTUR" ></Column>
                        <Column headerStyle={{ textAlign: "center" }} field="TGL" header="TANGGAL" ></Column>
                        <Column headerStyle={{ textAlign: "center" }} field="CUSTOMER" header="CUSTOMER" ></Column>
                        <Column headerStyle={{ textAlign: "center" }} field="DISCOUNT" header="DISCOUNT" ></Column>
                        <Column headerStyle={{ textAlign: "center" }} field="TOTBAYAR" header="TOTAL BAYAR" ></Column>
                        {/* <Column headerStyle={{ textAlign: "center" }} header="ACTION" body={actionBodyTemplate}></Column> */}
                    </DataTable>
                    <Toolbar className="mb-4" left={preview}></Toolbar>

                    {/* Dialog PelunasanPiutang  */}
                    <Dialog visible={pelunasanPiutangDialog} style={{ width: '75%' }} header="Tambah PelunasanPiutang " modal className="p-fluid" footer={pelunasanPiutangDialogFooter} onHide={hideDialog}>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="kode">Kode</label>
                                <div className="p-inputgroup">
                                    <InputText disabled id="kode" value={pelunasanPiutang.KODE} onChange={(e) => onInputChange(e, 'KODE')} className={classNames({ 'p-invalid': submitted && !pelunasanPiutang.KODE })} />
                                </div>
                                {submitted && !pelunasanPiutang.KODE && <small className="p-invalid">Kode is required.</small>}
                            </div>
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="keterangan">Keterangan</label>
                                <InputText id="keterangan" value={pelunasanPiutang.Keterangan} onChange={(e) => onInputChange(e, 'Keterangan')} required autoFocus className={classNames({ 'p-invalid': submitted && !pelunasanPiutang.Keterangan })} />
                                {submitted && !pelunasanPiutang.KETERANGAN && <small className="p-invalid">Keterangan is required.</small>}
                            </div>
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    )

}

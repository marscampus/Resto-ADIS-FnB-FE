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

import { useRouter } from 'next/router';

export default function MasterAddPelunasanPiutang(){
    const breadcrumbHome = { icon: 'pi pi-home', to: '/' };
    const breadcrumbItems = [{ label: 'Penjualan' }, { label: 'Pelunasan Piutang', to:'#' }];

    let emptypelunasanpiutang = {
        KODE:null,
    };

    const router = useRouter();
    const toast = useRef(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedCoa, setSelectedCoa] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [pelunasanPiutang, setPelunasanPiutang] = useState(emptypelunasanpiutang);
    const [addPelunasanPiutangDialog, setAddPelunasanPiutangDialog] = useState(false);
    const [keteranganCustomer, setKeteranganCustomer] = useState('');
    const [customerDialog, setCustomerDialog] = useState(false);
    const [editPelunasanPiutangDialog, setEditPelunasanPiutangDialog] = useState(false);
    const [customerTabel, setCustomerTabel] = useState(null);
    const [keteranganNamaProduk, setKeteranganNamaProduk] = useState('');
    const [keteranganKodeSatuan, setKeteranganKodeketeranganKodeSatuan] = useState('');
    const [keteranganSatuan, setKeteranganSatuan] = useState('');
    const [keteranganHarga, setKeteranganHarga] = useState('');
    const [namaProdukDialog, setNamaProdukDialog] = useState(false);
    const [namaProdukTabel, setNamaProdukTabel] = useState(null);
    const [produk, setProduk] = useState(emptypelunasanpiutang);
    const [customer, setCustomer] = useState(emptypelunasanpiutang);
    const [satuanDialog, setSatuanDialog] = useState(false);
    const [satuanTabel, setSatuanTabel] = useState(null);
    const [statusAction,setStatusAction] = useState(null);

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
    const columnsSatuan = [
        { field:'KODE',header: 'KODE'},
        { field:'KETERANGAN',header: 'KETERANGAN'},
    ];
    const columnsCustomer = [
        { field:'KODE',header: 'KODE'},
        { field:'NAMA',header: 'NAMA'},
        { field:'ALAMAT',header: 'ALAMAT'},
    ];
    const columnsNamaProduk = [
        { field:'KODE',header: 'KODE'},
        { field:'NAMA',header: 'NAMA'},
        { field:'SATUAN',header: 'SATUAN'},
        { field:'HB',header: 'HARGA BELI'},
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

    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        let _produk = { ...produk };
        _produk[`${name}`] = val;

        setProduk(_produk);
      };
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _produk = { ...produk };
        _produk[`${name}`] = val;
        setProduk(_produk);
        console.log(produk);
    };
    const setNull = () => {
        setKeteranganNamaProduk('');
        setKeteranganSatuan('');
        setKeteranganCustomer('');
        setKeteranganHarga('');
        setPelunasanPiutang({
            KODE: '',
            KODE_TOKO: '',
            NAMA: '',
            BARCODE: '',
            KETERANGAN: '',
            SATUAN: '',
        });
    }
    // ----------------------------------------------------------------------------------------------------------------- Hide Dialog
    const hideDialog = () => {
        setSubmitted(false);
        setAddPelunasanPiutangDialog(false);
        setNull();
    };
    const hideDialogCustomer = () => {
        setSubmitted(false);
        setCustomerDialog(false);
        setNull();
    };
    const hideDialogNamaProduk = () => {
        setSubmitted(false);
        setNamaProdukDialog(false);
        setNull();
    };
    const hideDialogSatuan = () => {
        setSubmitted(false);
        setSatuanDialog(false);
        setNull();
    };

    // -------------------------------------------------------------------------------------------------------------------- Dialog
    const openAdd = () => {
        // setCustomer(emptycustomer);
        setSubmitted(false);
        setAddPelunasanPiutangDialog(true);
        setStatusAction('store');
    };

    // -------------------------------------------------------------------------------------------------------------------- Func
    const saveAddPelunasanPiutang = async (e)=>{
        e.preventDefault();
    }

    // Customer -----------------------------------------------------------------------------------------------------------
    const toggleCustomer = async (event) =>{
        let indeks = null;
        let skipRequest = false;

        setCustomerDialog(true);
        setActiveIndex(event.index ?? 0);
        setLoadingItem(true);
        if(skipRequest === false){
            const resCustomer = await dataTableCustomer(indeks); console.log(resCustomer);
            setCustomerTabel(resCustomer.data);
            // updateStateCustomer(indeks,resCustomer);
        }
        setLoadingItem(false);
    }

    const dataTableCustomer = (KODE) => {
        return new Promise((resolve) => {
            return fetch('/api/daftar_customer', {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-ACTION":"get"},
                body:JSON.stringify({KODE:KODE})
            }).then((result)=> result.json())
            .then((body)=>{return resolve(body)});
            setCustomerDialog(true);
        });
    }

    const onRowSelectCustomer = (event) => {
        const selectedKode = event.data.KODE;
        const selectedCustomer = customerTabel.find((customer) => customer.KODE === selectedKode);

        if (selectedCustomer) {
        let _customer = { ...pelunasanPiutang };
        _customer.CUSTOMER = selectedCustomer.KODE;
        setPelunasanPiutang(_customer);

        setKeteranganCustomer(selectedCustomer.NAMA);
        console.log(pelunasanPiutang)
        }

        setCustomerDialog(false);
    };
    // NamaProduk --------------------------------------------------------------------------------------
    const toggleNamaProduk = async (event) =>{
        let indeks = null;
        let skipRequest = false;

        setNamaProdukDialog(true);
        setActiveIndex(event.index ?? 0);
        setLoadingItem(true);
        if(skipRequest === false){
            const resNamaProduk = await dataTableNamaProduk(indeks); console.log(resNamaProduk);
            setNamaProdukTabel(resNamaProduk.data);
            // updateStateNamaProduk(indeks,resNamaProduk);
        }
        setLoadingItem(false);
    }

    const dataTableNamaProduk = (KODE) => {
        return new Promise((resolve) => {
            return fetch('/api/produk', {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-ACTION":"get"},
                body:JSON.stringify({KODE:KODE})
            }).then((result)=> result.json())
            .then((body)=>{return resolve(body)});
            setNamaProdukDialog(true);
        });
    }

    const onRowSelectNamaProduk = (event) => {
        const selectedKode = event.data.KODE;
        const selectedNamaProduk = namaProdukTabel.find((namaProduk) => namaProduk.KODE === selectedKode);

        if (selectedNamaProduk) {
            console.log(selectedNamaProduk);
            let _namaProduk = { ...pelunasanPiutang };
            _namaProduk.NAMA = selectedNamaProduk.NAMA;
            setPelunasanPiutang(_namaProduk);
            setKeteranganNamaProduk(selectedNamaProduk.NAMA);
            setKeteranganSatuan(selectedNamaProduk.SATUAN);
            setKeteranganHarga(selectedNamaProduk.HB);
            console.log(pelunasanPiutang)
        }

        setNamaProdukDialog(false);
    };

    // ---------------------------------------------------------------------------------------------------------------- Button
    const rightFooterTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Save" className="p-button-primary p-button-outlined mr-2" />
                    <Button label="Cancel" className="p-button-secondary p-button-outlined" onClick={() => { router.push('/penjualan/pelunasan-piutang'); }} />
                </div>
            </React.Fragment>
        );
    };
    const addPelunasanPiutangFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Create" icon="pi pi-check" className="p-button-text" onClick={saveAddPelunasanPiutang} />
        </>
    );
    const editPelunasanPiutangFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Create" icon="pi pi-check" className="p-button-text" onClick={saveAddPelunasanPiutang} />
        </>
    );
    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <BreadCrumb home={breadcrumbHome} model={breadcrumbItems} style={{ background: 'none', border: 'none' }} />
                <div className="card">
                    <h4>Add Pelunasan Piutang</h4><hr/>
                    <Toast ref={toast} />
                    <div>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="faktur">Faktur</label>
                                <div className="p-inputgroup">
                                    <InputText value={pelunasanPiutang.FAKTUR} onChange={(e) => onInputChange(e, 'FAKTUR')} required className={classNames({ 'p-invalid': submitted && !pelunasanPiutang.FAKTUR })} />
                                </div>
                            </div>
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="tanggal">Tanggal</label>
                                <div className="p-inputgroup">
                                    <Calendar value={pelunasanPiutang.TGL} id="tgl" showIcon dateFormat="dd-mm-yy" readOnlyInput/>
                                </div>
                            </div>
                        </div>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="customer">Customer</label>
                                <div className="p-inputgroup">
                                    <InputText id="customer_kode" value={pelunasanPiutang.CUSTOMER} onChange={(e) => onInputChange(e, 'CUSTOMER')} className={classNames({ 'p-invalid': submitted && !pelunasanPiutang.CUSTOMER })} />
                                    <Button icon="pi pi-search" className="p-button" onClick={toggleCustomer} />
                                    <InputText readOnly id="ket-Customer" value={keteranganCustomer} />
                                </div>
                                {submitted && !pelunasanPiutang.CUSTOMER && <small className="p-invalid">Customer is required.</small>}
                            </div>
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="kota">Alamat</label>
                                <div className="p-inputgroup">
                                    <InputText value={pelunasanPiutang.ALAMAT} onChange={(e) => onInputChange(e, 'KOTA')} required  autoFocus className={classNames({ 'p-invalid': submitted && !pelunasanPiutang.KOTA })} />
                                    {/* {submitted && !pelunasanPiutang.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="my-2 text-right">
                        <Button label="Refresh" className="p-button-primary p-button-sm mr-2" />
                    </div><hr></hr>
                    <DataTable
                        // value={addPelunasanPiutang}
                        lazy
                        // dataKey="KODE"
                        // paginator
                        rows={10}
                        className='datatable-responsive'
                        first={lazyState.first}
                        totalRecords={totalRecords}
                        onPage={onPage}
                        loading={loading}
                    >
                        <Column headerStyle={{ textAlign: "center" }} field="FAKTUR" header="FAKTUR" ></Column>
                        <Column headerStyle={{ textAlign: "center" }} field="TGL" header="TANGGAL" ></Column>
                        <Column headerStyle={{ textAlign: "center" }} field="TOTFAKTUR" header="TOTAL FAKTUR" ></Column>
                        <Column headerStyle={{ textAlign: "center" }} field="SISAFAKTUR" header="SISA FAKTUR" ></Column>
                        <Column headerStyle={{ textAlign: "center" }} field="DISCOUNT" header="DISCOUNT" ></Column>
                        <Column headerStyle={{ textAlign: "center" }} field="PELUNASAN" header="PELUNASAN" ></Column>
                        <Column headerStyle={{ textAlign: "center" }} field="SISA" header="SISA" ></Column>
                        <Column headerStyle={{ textAlign: "center" }} field="KETERANGAN" header="KETERANGAN" ></Column>
                        {/* <Column headerStyle={{ textAlign: "center" }} header="ACTION" body={actionBodyTemplate}></Column> */}
                    </DataTable><br></br>
                    <Toolbar className="mb-4" right={rightFooterTemplate}></Toolbar>

                    {/* ------------------------------------------------------------------------------------------------------------------------- Dialog Customer */}
                    <Dialog visible={customerDialog} style={{ width: '75%' }} header="Customer" modal className="p-fluid" onHide={hideDialogCustomer}>
                        {loadingItem &&
                            <TabelSkaleton items={itemsSkelaton} kolom={columnsCustomer} />
                        }
                        {!loadingItem &&
                            <DataTable
                                value={customerTabel}
                                lazy
                                dataKey="KODE"
                                paginator
                                rows={10}
                                className="datatable-responsive"
                                first={lazyState.first}
                                totalRecords={totalRecords}
                                onPage={onPage}
                                loading={loading}
                                onRowSelect={onRowSelectCustomer}
                                selectionMode="single" // Memungkinkan pemilihan satu baris
                            >
                                <Column headerStyle={{ textAlign: "center" }} field="KODE" header="KODE" ></Column>
                                <Column headerStyle={{ textAlign: "center" }} field="NAMA" header="NAMA" ></Column>
                                <Column headerStyle={{ textAlign: "center" }} field="ALAMAT" header="ALAMAT" ></Column>
                            </DataTable>
                        }
                    </Dialog>

                    {/* ------------------------------------------------------------------------------------------------------------------------- Dialog Add II */}
                    <Dialog visible={addPelunasanPiutangDialog} style={{ width: '75%' }} header="Tambah Data " modal className="p-fluid" footer={addPelunasanPiutangFooter} onHide={hideDialog}>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-8">
                                <label htmlFor="kode">Kode Barang</label>
                                    <div className="p-inputgroup">
                                        <InputText autoFocus id="namaProduk" value={pelunasanPiutang.NAMA} onChange={(e) => onInputChange(e, 'NAMA')} required  className={classNames({ 'p-invalid': submitted && !pelunasanPiutang.NAMA })} />
                                        <Button icon="pi pi-search" className="p-button" onClick={toggleNamaProduk} />
                                        <InputText readOnly id="ket-produk" value={keteranganNamaProduk} />
                                    </div>
                                {submitted && !pelunasanPiutang.KODE && <small className="p-invalid">Kode is required.</small>}
                            </div>
                            <div className="field col-12 mb-2 lg:col-4">
                                <label htmlFor="keterangan">Satuan</label>
                                    <div className="p-inputgroup">
                                        {/* <InputText readOnly id="ket-produk" value={keteranganKodeSatuan} /> */}
                                        <InputText readOnly id="ket-Satuan" value={keteranganSatuan} />
                                    </div>
                                {submitted && !pelunasanPiutang.KETERANGAN && <small className="p-invalid">Keterangan is required.</small>}
                            </div>
                            <div className="field col-12 mb-2 lg:col-2">
                                <label htmlFor="qty">QTY</label>
                                <div className="p-inputgroup">
                                    <InputText onChange={(e) => onInputChange(e, 'QTY')} required  autoFocus className={classNames({ 'p-invalid': submitted && !pelunasanPiutang.QTY })} />
                                    {/* {submitted && !pelunasanPiutang.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
                                </div>
                            </div>
                            <div className="field col-12 mb-2 lg:col-4">
                                <label htmlFor="harga">Harga</label>
                                <div className="p-inputgroup">
                                    <InputNumber mode="currency" currency="IDR" locale="id-ID" readOnly id="ket-Satuan" value={keteranganHarga} />
                                </div>
                            </div>
                            <div className="field col-12 mb-2 lg:col-3">
                                <label htmlFor="discount">Discount</label>
                                <div className="p-inputgroup">
                                    <InputText onChange={(e) => onInputChange(e, 'DISCOUNT')} required  autoFocus className={classNames({ 'p-invalid': submitted && !pelunasanPiutang.DISCOUNT })} />
                                    {/* {submitted && !pelunasanPiutang.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
                                </div>
                            </div>
                            <div className="field col-12 mb-2 lg:col-3">
                                <label htmlFor="ppn">PPN</label>
                                <div className="p-inputgroup">
                                    <InputText onChange={(e) => onInputChange(e, 'PPN')} required  autoFocus className={classNames({ 'p-invalid': submitted && !pelunasanPiutang.PPN })} />
                                    {/* {submitted && !pelunasanPiutang.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
                                </div>
                            </div>
                            <div className="field col-12 mb-2 lg:col-12">
                                <label htmlFor="harga">Jumlah Harga</label>
                                <div className="p-inputgroup">
                                    <InputNumber mode="currency" currency="IDR" locale="id-ID" onChange={(e) => onInputNumberChange(e, 'JMLHARGA')} required  autoFocus className={classNames({ 'p-invalid': submitted && !pelunasanPiutang.JMLHARGA })} />
                                    {/* {submitted && !pelunasanPiutang.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
                                </div>
                            </div>
                        </div>
                    </Dialog>

                    {/* ----------------------------------------------------------------------------------------------------------------------- Dialog Nama Produk */}
                    <Dialog visible={namaProdukDialog} style={{ width: '75%' }} header="Nama Produk" modal className="p-fluid" onHide={hideDialogNamaProduk}>
                        {loadingItem &&
                            <TabelSkaleton items={itemsSkelaton} kolom={columnsNamaProduk} />
                        }
                        {!loadingItem &&
                            <DataTable
                                value={namaProdukTabel}
                                lazy
                                dataKey="KODE"
                                paginator
                                rows={10}
                                className="datatable-responsive"
                                first={lazyState.first}
                                totalRecords={totalRecords}
                                onPage={onPage}
                                loading={loading}
                                onRowSelect={onRowSelectNamaProduk}
                                selectionMode="single" // Memungkinkan pemilihan satu baris
                            >
                                <Column headerStyle={{ textAlign: "center" }} field="KODE" header="KODE" ></Column>
                                <Column headerStyle={{ textAlign: "center" }} field="NAMA" header="NAMA" ></Column>
                                <Column headerStyle={{ textAlign: "center" }} field="SATUAN" header="SATUAN" ></Column>
                                <Column headerStyle={{ textAlign: "center" }} field="HB" header="HARGA BELI" ></Column>
                            </DataTable>
                        }
                    </Dialog>

                    {/*Dialog Edit Pelunasan Piutang  */}
                    <Dialog visible={editPelunasanPiutangDialog} style={{ width: '75%' }} header="Tambah Rak " modal className="p-fluid" footer={editPelunasanPiutangFooter} onHide={hideDialog}>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="tgl">Tanggal</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly autoFocus id="tgl" value={pelunasanPiutang.TGL} onChange={(e) => onInputChange(e, 'TGL')} className={classNames({ 'p-invalid': submitted && !pelunasanPiutang.TGL })} />
                                </div>
                                {submitted && !pelunasanPiutang.TGL && <small className="p-invalid">Tanggal is required.</small>}
                            </div>
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="faktur">Faktur</label>
                                <InputText readOnly id="faktur" value={pelunasanPiutang.FAKTUR} onChange={(e) => onInputChange(e, 'FAKTUR')} required className={classNames({ 'p-invalid': submitted && !pelunasanPiutang.FAKTUR })} />
                                {submitted && !pelunasanPiutang.FAKTUR && <small className="p-invalid">FAKTUR is required.</small>}
                            </div>
                        </div>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="total">Total</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly autoFocus id="total" value={pelunasanPiutang.TOTAL} onChange={(e) => onInputChange(e, 'TOTAL')} className={classNames({ 'p-invalid': submitted && !pelunasanPiutang.TOTAL })} />
                                </div>
                                {submitted && !pelunasanPiutang.KODE && <small className="p-invalid">TOTAL is required.</small>}
                            </div>
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="sisa">Sisa Faktur</label>
                                <InputText readOnly id="sisa" value={pelunasanPiutang.SISA} onChange={(e) => onInputChange(e, 'SISA')} required className={classNames({ 'p-invalid': submitted && !pelunasanPiutang.SISA })} />
                                {submitted && !pelunasanPiutang.SISA && <small className="p-invalid">SISA is required.</small>}
                            </div>
                        </div>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-4">
                                <label htmlFor="disc">Discount</label>
                                <div className="p-inputgroup">
                                    <InputText  autoFocus id="disc" value={pelunasanPiutang.DISCOUNT} onChange={(e) => onInputChange(e, 'DISCOUNT')} className={classNames({ 'p-invalid': submitted && !pelunasanPiutang.DISCOUNT })} />
                                </div>
                                {submitted && !pelunasanPiutang.DISCOUNT && <small className="p-invalid">DISCOUNT is required.</small>}
                            </div>
                            <div className="field col-12 mb-2 lg:col-4">
                                <label htmlFor="pelunasan">Pelunasan</label>
                                <InputText id="pelunasan" value={pelunasanPiutang.PELUNASAN} onChange={(e) => onInputChange(e, 'PELUNASAN')} required className={classNames({ 'p-invalid': submitted && !pelunasanPiutang.PELUNASAN })} />
                                {submitted && !pelunasanPiutang.SISA && <small className="p-invalid">PELUNASAN is required.</small>}
                            </div>
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="sisa">Sisa</label>
                                <InputText readOnly id="sisa" value={pelunasanPiutang.SISA} onChange={(e) => onInputChange(e, 'SISA')} required className={classNames({ 'p-invalid': submitted && !pelunasanPiutang.SISA })} />
                                {submitted && !pelunasanPiutang.SISA && <small className="p-invalid">SISA is required.</small>}
                            </div>
                        </div>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-4">
                                <label htmlFor="ket">Keterangan</label>
                                <div className="p-inputgroup">
                                    <InputText  autoFocus id="ket" value={pelunasanPiutang.KETERANGAN} onChange={(e) => onInputChange(e, 'TOTAL')} className={classNames({ 'p-invalid': submitted && !pelunasanPiutang.KETERANGAN })} />
                                </div>
                                {submitted && !pelunasanPiutang.KETERANGAN && <small className="p-invalid">KETERANGAN is required.</small>}
                            </div>
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    )

}

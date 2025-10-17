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
import { Checkbox } from 'primereact/checkbox';
import { Calendar } from 'primereact/calendar';
import { useRouter } from 'next/router';

export default function MasterData(){
    const breadcrumbHome = { icon: 'pi pi-home', to: '/' };
    const breadcrumbItems = [{ label: 'Penjualan' }, { label: 'Retur Penjualan dengan Faktur' }, { label: 'Add', to:'#' }];

    let emptydata = {
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
    const [data, setData] = useState(emptydata);
    const [dataDialog, setDataDialog] = useState(false);
    const [stokBaruDialog, setStokBaruDialog] = useState(false);
    const [keteranganCustomer, setKeteranganCustomer] = useState('');
    const [customerDialog, setCustomerDialog] = useState(false);
    const [customerTabel, setCustomerTabel] = useState(null);
    const [fakturPenjualanDialog, setFakturPenjualanDialog] = useState(false);
    const [fakturPenjualanTabel, setFakturPenjualanTabel] = useState(null);
    const [isChecked, setIsChecked] = useState(false);
    const [statusAction,setStatusAction] = useState(null);
    const [keteranganNamaProduk, setKeteranganNamaProduk] = useState('');
    const [keteranganKodeSatuan, setKeteranganKodeketeranganKodeSatuan] = useState('');
    const [keteranganSatuan, setKeteranganSatuan] = useState('');
    const [keteranganHarga, setKeteranganHarga] = useState('');

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
    const columnsCustomer = [
        { field:'KODE',header: 'KODE'},
        { field:'NAMA',header: 'NAMA'},
        { field:'ALAMAT',header: 'ALAMAT'},
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

    const onInputChangeBarcode = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _barcode = { ...data };
        _barcode[`${name}`] = val;
        setData(_data);
        if (name === 'STATUS') {
            setStatus(e.target.checked ? 1 : 0);
          }
        // console.log(_barcode);
    };

    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        let _data = { ...data };
        _data[`${name}`] = val;

        setData(_data);
      };
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _data = { ...data };
        _data[`${name}`] = val;
        setData(_data);
        console.log(data);
    };
    // ----------------------------------------------------------------------------------------------------------------- Hide Dialog
    const hideDialog = () => {
        setSubmitted(false);
        setDataDialog(false);
    };

    // -------------------------------------------------------------------------------------------------------------------- Dialog
    const openStokBaru = () => {
        // setData(emptycustomer);
        setSubmitted(false);
        setDataDialog(true);
        setStatusAction('store');
    };
    const hideDialogCustomer = () => {
        setSubmitted(false);
        setCustomerDialog(false);
    };

    // -------------------------------------------------------------------------------------------------------------------- Func
    const saveData = async (e)=>{
        e.preventDefault();
    }

    // Faktur Penjualan -----------------------------------------------------------------------------------------------------------
    const toggleFakturPenjualan = async (event) =>{
        let indeks = null;
        let skipRequest = false;

        setFakturPenjualanDialog(true);
        setActiveIndex(event.index ?? 0);
        setLoadingItem(true);
        if(skipRequest === false){
            const resFakturPenjualan = await dataTableFakturPenjualan(indeks); console.log(resFakturPenjualan);
            setFakturPenjualanTabel(resFakturPenjualan.data);
            // updateStateFakturPenjualan(indeks,resCustomer);
        }
        setLoadingItem(false);
    }

    const dataTableFakturPenjualan = (KODE) => {
        return new Promise((resolve) => {
            // return fetch('/api/penjualan/po', {
            //     method: "POST",
            //     headers: { "Content-Type": "application/json", "X-ACTION":"get"},
            //     body:JSON.stringify({KODE:KODE})
            // }).then((result)=> result.json())
            // .then((body)=>{return resolve(body)});
            // setFakturPenjualanDialog(true);
        });
    }

    const onRowSelectFakturPenjualan = (event) => {
        const selectedKode = event.data.KODE;
        const selectedFakturPenjualan = fakturPenjualanTabel.find((fakturPenjualan) => fakturPenjualan.KODE === selectedKode);

        if (selectedFakturPenjualan) {
        let _fakturPenjualan = { ...data };
        _fakturPenjualan.SUPPLIER = selectedFakturPenjualan.KODE;
        setData(_fakturPenjualan);

        setKeteranganFakturPenjualan(selectedFakturPenjualan.NAMA);
        console.log(data)
        }

        setFakturPenjualanDialog(false);
    };

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
        let _customer = { ...data };
        _customer.SUPPLIER = selectedCustomer.KODE;
        setData(_customer);

        setKeteranganCustomer(selectedCustomer.NAMA);
        console.log(data)
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
            let _namaProduk = { ...po };
            _namaProduk.NAMA = selectedNamaProduk.NAMA;
            setPo(_namaProduk);
            setKeteranganNamaProduk(selectedNamaProduk.NAMA);
            setKeteranganSatuan(selectedNamaProduk.SATUAN);
            setKeteranganHarga(selectedNamaProduk.HB);
            console.log(po)
        }

        setNamaProdukDialog(false);
    };
    // ---------------------------------------------------------------------------------------------------------------- Button
    const rightFooterTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Delete" className="p-button-danger p-button-outlined mr-2"/>
                    <Button label="Save" className="p-button-primary p-button-outlined mr-2" />
                    <Button label="Cancel" className="p-button-secondary p-button-outlined" onClick={() => { router.push('/penjualan/retur-faktur'); }} />
                </div>
            </React.Fragment>
        );
    };
    const leftFooterTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <div className="formgrid grid">
                        <div className="field col-12 mb-2 lg:col-4">
                            <Checkbox inputId="status" value={data.STATUS} onChange={(e) => onInputChangeBarcode(e, 'STATUS')} style={{ marginRight:'5px' }} />
                            <label htmlFor="Konsinyasi">Konsinyasi</label>
                        </div>
                        <div className="field col-12 mb-2 lg:col-4">
                            <label htmlFor="faktur">Faktur PO</label>
                            <div className="p-inputgroup">
                                <InputText value={data.FAKTURPO} onChange={(e) => onInputChange(e, 'FAKTURPO')} required className={classNames({ 'p-invalid': submitted && !data.FAKTURPO })} />
                                <Button icon="pi pi-search" className="p-button" />
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    };
    const dataDialogFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveData} />
        </>
    );

    const stokBaruFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" className="p-button-text" />
        </>
    );

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <BreadCrumb home={breadcrumbHome} model={breadcrumbItems} style={{ background: 'none', border: 'none' }} />
                <div className="card">
                    <h4>Add Retur Penjualan dengan Faktur</h4><hr/>
                    <Toast ref={toast} />
                    <div>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-4">
                                <label htmlFor="faktur">Faktur Penjualan</label>
                                <div className="p-inputgroup">
                                    <InputText value={data.FAKTURPEMBELIAN} onChange={(e) => onInputChange(e, 'FAKTURPEMBELIAN')} required className={classNames({ 'p-invalid': submitted && !data.FAKTURPEMBELIAN })} />
                                    <Button icon="pi pi-search" className="p-button" onClick={toggleFakturPenjualan}/>
                                </div>
                            </div>
                            <div className="field col-12 mb-2 lg:col-4">
                                <label htmlFor="fakturasli">Faktur Asli</label>
                                <div className="p-inputgroup">
                                    <InputText value={data.FAKTURASLI} onChange={(e) => onInputChange(e, 'FAKTURASLI')} required  autoFocus className={classNames({ 'p-invalid': submitted && !data.FAKTURASLI })} />
                                    {/* {submitted && !data.KODE_TOKO && <small className="p-invalid">Faktur Asl is required.</small>} */}
                                </div>
                            </div>
                            <div className="field col-12 mb-2 lg:col-4">
                                <label htmlFor="faktur">Faktur</label>
                                <div className="p-inputgroup">
                                    <InputText value={data.FAKTUR} onChange={(e) => onInputChange(e, 'FAKTUR')} required className={classNames({ 'p-invalid': submitted && !data.FAKTUR })} />
                                </div>
                            </div>
                        </div>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-12">
                                <label htmlFor="customer">Customer</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly id="customer_kode" value={data.SUPPLIER} onChange={(e) => onInputChange(e, 'SUPPLIER')} className={classNames({ 'p-invalid': submitted && !data.SUPPLIER })} />
                                    {/* <Button icon="pi pi-search" className="p-button" onClick={toggleCustomer} /> */}
                                    <InputText readOnly id="ket-Customer" value={keteranganCustomer} />
                                </div>
                                {submitted && !data.SUPPLIER && <small className="p-invalid">Customer is required.</small>}
                            </div>
                        </div>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-3">
                                <label htmlFor="tanggal">Tanggal</label>
                                <div className="p-inputgroup">
                                    <Calendar id="tgl" value={data.TGL} showIcon dateFormat="dd-mm-yy" readOnlyInput/>
                                </div>
                            </div>
                            <div className="field col-12 mb-2 lg:col-3">
                                <label htmlFor="tanggal">Jatuh Tempo</label>
                                <div className="p-inputgroup">
                                    <Calendar id="jatuhtempo" value={data.JTHTMP} showIcon dateFormat="dd-mm-yy" readOnlyInput/>
                                </div>
                            </div>
                            <div className="field col-12 mb-2 lg:col-3">
                                <label htmlFor="discount">Discount</label>
                                <div className="p-inputgroup">
                                    <InputText type='number' value={data.DISCOUNT} onChange={(e) => onInputChange(e, 'DISCOUNT')} required className={classNames({ 'p-invalid': submitted && !data.DISCOUNT })} />
                                    <Button icon="pi pi-percentage" className="p-button" readOnly />
                                </div>
                            </div>
                            <div className="field col-12 mb-2 lg:col-3">
                                <label htmlFor="ppn">Ppn</label>
                                <div className="p-inputgroup">
                                    <InputText type='number' value={data.PPN} onChange={(e) => onInputChange(e, 'PPN')} required className={classNames({ 'p-invalid': submitted && !data.PPN })} />
                                    <Button icon="pi pi-percentage" className="p-button" readOnly />
                                </div>
                            </div>
                        </div>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-4">
                                <label htmlFor="kota">Kota</label>
                                <div className="p-inputgroup">
                                    <InputText value={data.KOTA} onChange={(e) => onInputChange(e, 'KOTA')} required  autoFocus className={classNames({ 'p-invalid': submitted && !data.KOTA })} />
                                    {/* {submitted && !data.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
                                </div>
                            </div>
                            <div className="field col-12 mb-2 lg:col-8">
                                <label htmlFor="kota">Alamat</label>
                                <div className="p-inputgroup">
                                    <InputText value={data.ALAMAT} onChange={(e) => onInputChange(e, 'KOTA')} required  autoFocus className={classNames({ 'p-invalid': submitted && !data.KOTA })} />
                                    {/* {submitted && !data.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="my-2 text-right">
                        <Button label="Add" className="p-button-primary p-button-sm mr-2" onClick={openStokBaru} />
                    </div><hr></hr>
                    <DataTable
                        // value={data}
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
                        <Column headerStyle={{ textAlign: "center" }} field="KODE" header="KODE" ></Column>
                        <Column headerStyle={{ textAlign: "center" }} field="NAMA" header="NAMA" ></Column>
                        <Column headerStyle={{ textAlign: "center" }} field="QTY" header="QTY" ></Column>
                        <Column headerStyle={{ textAlign: "center" }} field="SATUAN" header="SATUAN" ></Column>
                        <Column headerStyle={{ textAlign: "center" }} field="HARGA" header="HARGA" ></Column>
                        <Column headerStyle={{ textAlign: "center" }} field="DISC" header="DISC" ></Column>
                        <Column headerStyle={{ textAlign: "center" }} field="JUMLAH" header="JUMLAH" ></Column>
                        {/* <Column headerStyle={{ textAlign: "center" }} header="ACTION" body={actionBodyTemplate}></Column> */}
                    </DataTable><br></br>
                    <div className="formgrid grid">
                        <div className="field col-12 mb-2 lg:col-2">
                            <label htmlFor="subtotal">Sub Total</label>
                            <div className="p-inputgroup">
                                <InputNumber mode="currency" currency="IDR" locale="id-ID" readOnly onChange={(e) => onInputNumberChange(e, 'SUBTOTAL')} required  autoFocus className={classNames({ 'p-invalid': submitted && !data.SUBTOTAL })} />
                                {/* {submitted && !data.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
                            </div>
                        </div>
                        <div className="field col-12 mb-2 lg:col-1">
                            <label htmlFor="discount">Discount</label>
                            <div className="p-inputgroup">
                                <InputText readOnly onChange={(e) => onInputChange(e, 'DISCOUNT')} required  autoFocus className={classNames({ 'p-invalid': submitted && !data.DISCOUNT })} />
                                {/* {submitted && !data.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
                            </div>
                        </div>
                        <div className="field col-12 mb-2 lg:col-1">
                            <label htmlFor="ppn">PPN</label>
                            <div className="p-inputgroup">
                                <InputText readOnly onChange={(e) => onInputChange(e, 'PPN')} required  autoFocus className={classNames({ 'p-invalid': submitted && !data.PPN })} />
                                {/* {submitted && !data.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
                            </div>
                        </div>
                        <div className="field col-12 mb-2 lg:col-2">
                            <label htmlFor="pembulatan">Pembulatan</label>
                            <div className="p-inputgroup">
                                <InputNumber mode="currency" currency="IDR" locale="id-ID" onChange={(e) => onInputNumberChange(e, 'PEMBULATAN')} required  autoFocus className={classNames({ 'p-invalid': submitted && !data.PEMBULATAN })} />
                                {/* {submitted && !data.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
                            </div>
                        </div>
                        <div className="field col-12 mb-2 lg:col-2">
                            <label htmlFor="total">Total</label>
                            <div className="p-inputgroup">
                                <InputNumber mode="currency" currency="IDR" locale="id-ID" readOnly onChange={(e) => onInputNumberChange(e, 'TOTAL')} required  autoFocus className={classNames({ 'p-invalid': submitted && !data.TOTAL })} />
                                {/* {submitted && !data.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
                            </div>
                        </div>
                        <div className="field col-12 mb-2 lg:col-2">
                            <label htmlFor="tunai">Tunai/Uang Muka</label>
                            <div className="p-inputgroup">
                                <InputNumber mode="currency" currency="IDR" locale="id-ID" onChange={(e) => onInputNumberChange(e, 'TUNAI')} required  autoFocus className={classNames({ 'p-invalid': submitted && !data.TUNAI })} />
                                {/* {submitted && !data.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
                            </div>
                        </div>
                        <div className="field col-12 mb-2 lg:col-2">
                            <label htmlFor="hutang">Hutang</label>
                            <div className="p-inputgroup">
                                <InputNumber mode="currency" currency="IDR" locale="id-ID" readOnly onChange={(e) => onInputNumberChange(e, 'HUTANG')} required  autoFocus className={classNames({ 'p-invalid': submitted && !data.HUTANG })} />
                                {/* {submitted && !data.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
                            </div>
                        </div>
                    </div>
                    <Toolbar className="mb-4" right={rightFooterTemplate}></Toolbar>


                    {/* Dialog Data  */}
                    <Dialog visible={dataDialog} style={{ width: '75%' }} header="Tambah Data " modal className="p-fluid" footer={dataDialogFooter} onHide={hideDialog}>
                    <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-8">
                                <label htmlFor="kode">Kode Barang</label>
                                    <div className="p-inputgroup">
                                        <InputText autoFocus id="namaProduk" value={data.NAMA} onChange={(e) => onInputChange(e, 'NAMA')} required  className={classNames({ 'p-invalid': submitted && !po.NAMA })} />
                                        <Button icon="pi pi-search" className="p-button" onClick={toggleNamaProduk} />
                                        <InputText readOnly id="ket-produk" value={keteranganNamaProduk} />
                                    </div>
                                {submitted && !po.KODE && <small className="p-invalid">Kode is required.</small>}
                            </div>
                            <div className="field col-12 mb-2 lg:col-4">
                                <label htmlFor="keterangan">Satuan</label>
                                    <div className="p-inputgroup">
                                        {/* <InputText readOnly id="ket-produk" value={keteranganKodeSatuan} /> */}
                                        <InputText readOnly id="ket-Satuan" value={keteranganSatuan} />
                                    </div>
                                {submitted && !po.KETERANGAN && <small className="p-invalid">Keterangan is required.</small>}
                            </div>
                            <div className="field col-12 mb-2 lg:col-2">
                                <label htmlFor="qty">QTY</label>
                                <div className="p-inputgroup">
                                    <InputText onChange={(e) => onInputChange(e, 'QTY')} required  autoFocus className={classNames({ 'p-invalid': submitted && !po.QTY })} />
                                    {/* {submitted && !po.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
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
                                    <InputText onChange={(e) => onInputChange(e, 'DISCOUNT')} required  autoFocus className={classNames({ 'p-invalid': submitted && !po.DISCOUNT })} />
                                    {/* {submitted && !po.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
                                </div>
                            </div>
                            <div className="field col-12 mb-2 lg:col-3">
                                <label htmlFor="ppn">PPN</label>
                                <div className="p-inputgroup">
                                    <InputText onChange={(e) => onInputChange(e, 'PPN')} required  autoFocus className={classNames({ 'p-invalid': submitted && !po.PPN })} />
                                    {/* {submitted && !po.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
                                </div>
                            </div>
                            <div className="field col-12 mb-2 lg:col-12">
                                <label htmlFor="harga">Jumlah Harga</label>
                                <div className="p-inputgroup">
                                    <InputNumber mode="currency" currency="IDR" locale="id-ID" onChange={(e) => onInputNumberChange(e, 'JMLHARGA')} required  autoFocus className={classNames({ 'p-invalid': submitted && !po.JMLHARGA })} />
                                    {/* {submitted && !po.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
                                </div>
                            </div>
                        </div>
                    </Dialog>

                    {/* ------------------------------------------------------Dialog Tabel----------------------------------------------------------------------- */}
                    {/* Dialog Customer */}
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
                </div>
            </div>
        </div>
    )

}

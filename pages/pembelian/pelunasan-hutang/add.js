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
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';

import { useRouter } from 'next/router';

export default function MasterAddPelunasanHutang() {
    const breadcrumbHome = { icon: 'pi pi-home', to: '/' };
    const breadcrumbItems = [{ label: 'Pembelian' }, { label: 'Pelunasan Hutang', to: '#' }];

    let emptypelunasanhutang = {
        KODE: null,
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
    const [pelunasanHutang, setPelunasanHutang] = useState(emptypelunasanhutang);
    const [addPelunasanHutangDialog, setAddPelunasanHutangDialog] = useState(false);
    const [keteranganSupplier, setKeteranganSupplier] = useState('');
    const [supplierDialog, setSupplierDialog] = useState(false);
    const [editPelunasanHutangDialog, setEditPelunasanHutangDialog] = useState(false);
    const [supplierTabel, setSupplierTabel] = useState(null);
    const [keteranganNamaProduk, setKeteranganNamaProduk] = useState('');
    const [keteranganKodeSatuan, setKeteranganKodeketeranganKodeSatuan] = useState('');
    const [keteranganSatuan, setKeteranganSatuan] = useState('');
    const [keteranganHarga, setKeteranganHarga] = useState('');
    const [namaProdukDialog, setNamaProdukDialog] = useState(false);
    const [namaProdukTabel, setNamaProdukTabel] = useState(null);
    const [produk, setProduk] = useState(emptypelunasanhutang);
    const [supplier, setSupplier] = useState(emptypelunasanhutang);
    const [satuanDialog, setSatuanDialog] = useState(false);
    const [satuanTabel, setSatuanTabel] = useState(null);
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
        { field: 'KODE', header: 'KODE' },
    ];
    const columnsSatuan = [
        { field: 'KODE', header: 'KODE' },
        { field: 'KETERANGAN', header: 'KETERANGAN' },
    ];
    const columnsSupplier = [
        { field: 'KODE', header: 'KODE' },
        { field: 'NAMA', header: 'NAMA' },
        { field: 'ALAMAT', header: 'ALAMAT' },
    ];
    const columnsNamaProduk = [
        { field: 'KODE', header: 'KODE' },
        { field: 'NAMA', header: 'NAMA' },
        { field: 'SATUAN', header: 'SATUAN' },
        { field: 'HB', header: 'HARGA BELI' },
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
    };
    const setNull = () => {
        setKeteranganNamaProduk('');
        setKeteranganSatuan('');
        setKeteranganSupplier('');
        setKeteranganHarga('');
        setPelunasanHutang({
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
        setAddPelunasanHutangDialog(false);
        setNull();
    };
    const hideDialogSupplier = () => {
        setSubmitted(false);
        setSupplierDialog(false);
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
        setAddPelunasanHutangDialog(true);
        setStatusAction('store');
    };

    // -------------------------------------------------------------------------------------------------------------------- Func
    const saveAddPelunasanHutang = async (e) => {
        e.preventDefault();
    }

    // Supplier -----------------------------------------------------------------------------------------------------------
    const toggleSupplier = async (event) => {
        let indeks = null;
        let skipRequest = false;

        setSupplierDialog(true);
        setActiveIndex(event.index ?? 0);
        setLoadingItem(true);
        if (skipRequest === false) {
            const resSupplier = await dataTableSupplier(indeks);
            setSupplierTabel(resSupplier.data);
            // updateStateSupplier(indeks,resSupplier);
        }
        setLoadingItem(false);
    }

    const dataTableSupplier = (KODE) => {
        return new Promise((resolve) => {
            return fetch('/api/daftar_supplier', {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-ACTION": "get" },
                body: JSON.stringify({ KODE: KODE })
            }).then((result) => result.json())
                .then((body) => { return resolve(body) });
            setSupplierDialog(true);
        });
    }

    const onRowSelectSupplier = (event) => {
        const selectedKode = event.data.KODE;
        const selectedSupplier = supplierTabel.find((supplier) => supplier.KODE === selectedKode);

        if (selectedSupplier) {
            let _supplier = { ...pelunasanHutang };
            _supplier.SUPPLIER = selectedSupplier.KODE;
            setPelunasanHutang(_supplier);

            setKeteranganSupplier(selectedSupplier.NAMA);
        }

        setSupplierDialog(false);
    };
    // NamaProduk --------------------------------------------------------------------------------------
    const toggleNamaProduk = async (event) => {
        let indeks = null;
        let skipRequest = false;

        setNamaProdukDialog(true);
        setActiveIndex(event.index ?? 0);
        setLoadingItem(true);
        if (skipRequest === false) {
            const resNamaProduk = await dataTableNamaProduk(indeks);
            setNamaProdukTabel(resNamaProduk.data);
            // updateStateNamaProduk(indeks,resNamaProduk);
        }
        setLoadingItem(false);
    }

    const dataTableNamaProduk = (KODE) => {
        return new Promise((resolve) => {
            return fetch('/api/produk', {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-ACTION": "get" },
                body: JSON.stringify({ KODE: KODE })
            }).then((result) => result.json())
                .then((body) => { return resolve(body) });
            setNamaProdukDialog(true);
        });
    }

    const onRowSelectNamaProduk = (event) => {
        const selectedKode = event.data.KODE;
        const selectedNamaProduk = namaProdukTabel.find((namaProduk) => namaProduk.KODE === selectedKode);

        if (selectedNamaProduk) {
            let _namaProduk = { ...pelunasanHutang };
            _namaProduk.NAMA = selectedNamaProduk.NAMA;
            setPelunasanHutang(_namaProduk);
            setKeteranganNamaProduk(selectedNamaProduk.NAMA);
            setKeteranganSatuan(selectedNamaProduk.SATUAN);
            setKeteranganHarga(selectedNamaProduk.HB);
        }

        setNamaProdukDialog(false);
    };

    // ---------------------------------------------------------------------------------------------------------------- Button
    const rightFooterTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Save" className="p-button-primary p-button-outlined mr-2" />
                    <Button label="Cancel" className="p-button-secondary p-button-outlined" onClick={() => { router.push('/pembelian/pelunasan-hutang'); }} />
                </div>
            </React.Fragment>
        );
    };
    const addPelunasanHutangFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Create" icon="pi pi-check" className="p-button-text" onClick={saveAddPelunasanHutang} />
        </>
    );
    const editPelunasanHutangFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Create" icon="pi pi-check" className="p-button-text" onClick={saveAddPelunasanHutang} />
        </>
    );

    let footerGroup =
        <ColumnGroup>
            <Row>
                <Column headerStyle={{ textAlign: "center" }} footer="Total:" colSpan={2} footerStyle={{ textAlign: 'right' }} />
                {/* <Column headerStyle={{ textAlign: "center" }} footer="Data" /> */}
                <Column headerStyle={{ textAlign: "center" }} colSpan={1} footer="-Total Faktur-" />
                <Column headerStyle={{ textAlign: "center" }} colSpan={1} footer="-Sisa Faktur-" />
                <Column headerStyle={{ textAlign: "center" }} colSpan={1} footer="-Disc-" />
                <Column headerStyle={{ textAlign: "center" }} colSpan={1} footer="-Pelunasan-" />
                <Column headerStyle={{ textAlign: "center" }} colSpan={2} footer="-Sisa-" />
            </Row>
        </ColumnGroup>;

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <BreadCrumb home={breadcrumbHome} model={breadcrumbItems} style={{ background: 'none', border: 'none' }} />
                <div className="card">
                    <h4>Add Pelunasan Hutang</h4><hr />
                    <Toast ref={toast} />
                    <div>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="faktur">Faktur</label>
                                <div className="p-inputgroup">
                                    <InputText value={pelunasanHutang.FAKTUR} onChange={(e) => onInputChange(e, 'FAKTUR')} required className={classNames({ 'p-invalid': submitted && !pelunasanHutang.FAKTUR })} />
                                </div>
                            </div>
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="tanggal">Tanggal</label>
                                <div className="p-inputgroup">
                                    <Calendar value={pelunasanHutang.TGL} id="tgl" showIcon dateFormat="dd-mm-yy" readOnlyInput />
                                </div>
                            </div>
                        </div>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="supplier">Supplier</label>
                                <div className="p-inputgroup">
                                    <InputText id="supplier_kode" value={pelunasanHutang.SUPPLIER} onChange={(e) => onInputChange(e, 'SUPPLIER')} className={classNames({ 'p-invalid': submitted && !pelunasanHutang.SUPPLIER })} />
                                    <Button icon="pi pi-search" className="p-button" onClick={toggleSupplier} />
                                    <InputText readOnly id="ket-Supplier" value={keteranganSupplier} />
                                </div>
                                {submitted && !pelunasanHutang.SUPPLIER && <small className="p-invalid">Supplier is required.</small>}
                            </div>
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="kota">Alamat</label>
                                <div className="p-inputgroup">
                                    <InputText value={pelunasanHutang.ALAMAT} onChange={(e) => onInputChange(e, 'KOTA')} required autoFocus className={classNames({ 'p-invalid': submitted && !pelunasanHutang.KOTA })} />
                                    {/* {submitted && !pelunasanHutang.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="my-2 text-right">
                        <Button label="Refresh" className="p-button-primary p-button-sm mr-2" />
                    </div><hr></hr>
                    <DataTable
                        // value={addPelunasanHutang}
                        lazy
                        // dataKey="KODE"
                        // paginator
                        rows={10}
                        className='datatable-responsive'
                        first={lazyState.first}
                        totalRecords={totalRecords}
                        onPage={onPage}
                        loading={loading}
                        footerColumnGroup={footerGroup}
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

                    {/* ------------------------------------------------------------------------------------------------------------------------- Dialog Supplier */}
                    <Dialog visible={supplierDialog} style={{ width: '75%' }} header="Supplier" modal className="p-fluid" onHide={hideDialogSupplier}>
                        {loadingItem &&
                            <TabelSkaleton items={itemsSkelaton} kolom={columnsSupplier} />
                        }
                        {!loadingItem &&
                            <DataTable
                                value={supplierTabel}
                                lazy
                                dataKey="KODE"
                                paginator
                                rows={10}
                                className="datatable-responsive"
                                first={lazyState.first}
                                totalRecords={totalRecords}
                                onPage={onPage}
                                loading={loading}
                                onRowSelect={onRowSelectSupplier}
                                selectionMode="single" // Memungkinkan pemilihan satu baris
                            >
                                <Column headerStyle={{ textAlign: "center" }} field="KODE" header="KODE" ></Column>
                                <Column headerStyle={{ textAlign: "center" }} field="NAMA" header="NAMA" ></Column>
                                <Column headerStyle={{ textAlign: "center" }} field="ALAMAT" header="ALAMAT" ></Column>
                            </DataTable>
                        }
                    </Dialog>

                    {/* ------------------------------------------------------------------------------------------------------------------------- Dialog Add II */}
                    <Dialog visible={addPelunasanHutangDialog} style={{ width: '75%' }} header="Tambah Data " modal className="p-fluid" footer={addPelunasanHutangFooter} onHide={hideDialog}>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-8">
                                <label htmlFor="kode">Kode Barang</label>
                                <div className="p-inputgroup">
                                    <InputText autoFocus id="namaProduk" value={pelunasanHutang.NAMA} onChange={(e) => onInputChange(e, 'NAMA')} required className={classNames({ 'p-invalid': submitted && !pelunasanHutang.NAMA })} />
                                    <Button icon="pi pi-search" className="p-button" onClick={toggleNamaProduk} />
                                    <InputText readOnly id="ket-produk" value={keteranganNamaProduk} />
                                </div>
                                {submitted && !pelunasanHutang.KODE && <small className="p-invalid">Kode is required.</small>}
                            </div>
                            <div className="field col-12 mb-2 lg:col-4">
                                <label htmlFor="keterangan">Satuan</label>
                                <div className="p-inputgroup">
                                    {/* <InputText readOnly id="ket-produk" value={keteranganKodeSatuan} /> */}
                                    <InputText readOnly id="ket-Satuan" value={keteranganSatuan} />
                                </div>
                                {submitted && !pelunasanHutang.KETERANGAN && <small className="p-invalid">Keterangan is required.</small>}
                            </div>
                            <div className="field col-12 mb-2 lg:col-2">
                                <label htmlFor="qty">QTY</label>
                                <div className="p-inputgroup">
                                    <InputText onChange={(e) => onInputChange(e, 'QTY')} required autoFocus className={classNames({ 'p-invalid': submitted && !pelunasanHutang.QTY })} />
                                    {/* {submitted && !pelunasanHutang.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
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
                                    <InputText onChange={(e) => onInputChange(e, 'DISCOUNT')} required autoFocus className={classNames({ 'p-invalid': submitted && !pelunasanHutang.DISCOUNT })} />
                                    {/* {submitted && !pelunasanHutang.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
                                </div>
                            </div>
                            <div className="field col-12 mb-2 lg:col-3">
                                <label htmlFor="ppn">PPN</label>
                                <div className="p-inputgroup">
                                    <InputText onChange={(e) => onInputChange(e, 'PPN')} required autoFocus className={classNames({ 'p-invalid': submitted && !pelunasanHutang.PPN })} />
                                    {/* {submitted && !pelunasanHutang.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
                                </div>
                            </div>
                            <div className="field col-12 mb-2 lg:col-12">
                                <label htmlFor="harga">Jumlah Harga</label>
                                <div className="p-inputgroup">
                                    <InputNumber mode="currency" currency="IDR" locale="id-ID" onChange={(e) => onInputNumberChange(e, 'JMLHARGA')} required autoFocus className={classNames({ 'p-invalid': submitted && !pelunasanHutang.JMLHARGA })} />
                                    {/* {submitted && !pelunasanHutang.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
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

                    {/*Dialog Edit Pelunasan Hutang  */}
                    <Dialog visible={editPelunasanHutangDialog} style={{ width: '75%' }} header="Edit Pelunasan Hutang " modal className="p-fluid" footer={editPelunasanHutangFooter} onHide={hideDialog}>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="tgl">Tanggal</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly autoFocus id="tgl" value={pelunasanHutang.TGL} onChange={(e) => onInputChange(e, 'TGL')} className={classNames({ 'p-invalid': submitted && !pelunasanHutang.TGL })} />
                                </div>
                                {submitted && !pelunasanHutang.TGL && <small className="p-invalid">Tanggal is required.</small>}
                            </div>
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="faktur">Faktur</label>
                                <InputText readOnly id="faktur" value={pelunasanHutang.FAKTUR} onChange={(e) => onInputChange(e, 'FAKTUR')} required className={classNames({ 'p-invalid': submitted && !pelunasanHutang.FAKTUR })} />
                                {submitted && !pelunasanHutang.FAKTUR && <small className="p-invalid">FAKTUR is required.</small>}
                            </div>
                        </div>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="total">Total</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly autoFocus id="total" value={pelunasanHutang.TOTAL} onChange={(e) => onInputChange(e, 'TOTAL')} className={classNames({ 'p-invalid': submitted && !pelunasanHutang.TOTAL })} />
                                </div>
                                {submitted && !pelunasanHutang.KODE && <small className="p-invalid">TOTAL is required.</small>}
                            </div>
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="sisa">Sisa Faktur</label>
                                <InputText readOnly id="sisa" value={pelunasanHutang.SISA} onChange={(e) => onInputChange(e, 'SISA')} required className={classNames({ 'p-invalid': submitted && !pelunasanHutang.SISA })} />
                                {submitted && !pelunasanHutang.SISA && <small className="p-invalid">SISA is required.</small>}
                            </div>
                        </div>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-4">
                                <label htmlFor="disc">Discount</label>
                                <div className="p-inputgroup">
                                    <InputText autoFocus id="disc" value={pelunasanHutang.DISCOUNT} onChange={(e) => onInputChange(e, 'DISCOUNT')} className={classNames({ 'p-invalid': submitted && !pelunasanHutang.DISCOUNT })} />
                                </div>
                                {submitted && !pelunasanHutang.DISCOUNT && <small className="p-invalid">DISCOUNT is required.</small>}
                            </div>
                            <div className="field col-12 mb-2 lg:col-4">
                                <label htmlFor="pelunasan">Pelunasan</label>
                                <InputText id="pelunasan" value={pelunasanHutang.PELUNASAN} onChange={(e) => onInputChange(e, 'PELUNASAN')} required className={classNames({ 'p-invalid': submitted && !pelunasanHutang.PELUNASAN })} />
                                {submitted && !pelunasanHutang.SISA && <small className="p-invalid">PELUNASAN is required.</small>}
                            </div>
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="sisa">Sisa</label>
                                <InputText readOnly id="sisa" value={pelunasanHutang.SISA} onChange={(e) => onInputChange(e, 'SISA')} required className={classNames({ 'p-invalid': submitted && !pelunasanHutang.SISA })} />
                                {submitted && !pelunasanHutang.SISA && <small className="p-invalid">SISA is required.</small>}
                            </div>
                        </div>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-4">
                                <label htmlFor="ket">Keterangan</label>
                                <div className="p-inputgroup">
                                    <InputText autoFocus id="ket" value={pelunasanHutang.KETERANGAN} onChange={(e) => onInputChange(e, 'TOTAL')} className={classNames({ 'p-invalid': submitted && !pelunasanHutang.KETERANGAN })} />
                                </div>
                                {submitted && !pelunasanHutang.KETERANGAN && <small className="p-invalid">KETERANGAN is required.</small>}
                            </div>
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    )

}

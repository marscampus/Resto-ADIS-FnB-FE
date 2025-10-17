import getConfig from "next/config";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { FileUpload } from "primereact/fileupload";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { RadioButton } from "primereact/radiobutton";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { classNames } from "primereact/utils";
import React, { useEffect, useRef, useState } from "react";
import { OverlayPanel } from "primereact/overlaypanel";
import { TabView, TabPanel } from "primereact/tabview";
import { Skeleton } from "primereact/skeleton";
import TabelSkaleton from "../../../component/tabel/skaleton";
import { Paginator } from "primereact/paginator";
import { BreadCrumb } from "primereact/breadcrumb";
import { Calendar } from "primereact/calendar";

import { useRouter } from "next/router";

export default function MasterAddMitra() {
    // PATH API
    const apiDirPath = '/api/api_crud_kode/';
    const apiEndPointGetFaktur = '/api/penjualanmitra/get_faktur';
    // API READ
    const apiEndPointStore = '/api/penjualanmitra/store';

	const router = useRouter();
	const toast = useRef(null);
	const [submitted, setSubmitted] = useState(false);
	const [loading, setLoading] = useState(false);
	const [loadingItem, setLoadingItem] = useState(false);
	const [totalRecords, setTotalRecords] = useState(0);
	const [selectAll, setSelectAll] = useState(false);
	const [selectedCoa, setSelectedCoa] = useState(null);
	const [activeIndex, setActiveIndex] = useState(0);
	const [mitra, setMitra] = useState([]);
	const [addMitraDialog, setAddMitraDialog] = useState(false);
	const [keteranganCustomer, setKeteranganCustomer] = useState("");
	const [customerDialog, setCustomerDialog] = useState(false);
	const [customerTabel, setCustomerTabel] = useState(null);
	const [keteranganNamaProduk, setKeteranganNamaProduk] = useState("");
	const [keteranganKodeSatuan, setKeteranganKodeketeranganKodeSatuan] = useState("");
	const [keteranganSatuan, setKeteranganSatuan] = useState("");
	const [keteranganHarga, setKeteranganHarga] = useState("");
	const [namaProdukDialog, setNamaProdukDialog] = useState(false);
	const [namaProdukTabel, setNamaProdukTabel] = useState(null);
	const [produk, setProduk] = useState([]);
	const [customer, setCustomer] = useState([]);
	const [satuanDialog, setSatuanDialog] = useState(false);
	const [satuanTabel, setSatuanTabel] = useState(null);
	const [statusAction, setStatusAction] = useState(null);

	const [lazyState, setlazyState] = useState({
		first: 0,
		rows: 10,
		page: 0,
		sortField: null,
		sortOrder: null,
		filters: {},
	});
	const itemsSkelaton = Array.from({ length: 2 }, (v, i) => i);
	const columns = [{ field: "KODE", header: "KODE" }];
	const columnsSatuan = [
		{ field: "KODE", header: "KODE" },
		{ field: "KETERANGAN", header: "KETERANGAN" },
	];
	const columnsCustomer = [
		{ field: "KODE", header: "KODE" },
		{ field: "NAMA", header: "NAMA" },
		{ field: "ALAMAT", header: "ALAMAT" },
	];
	const columnsNamaProduk = [
		{ field: "KODE", header: "KODE" },
		{ field: "NAMA", header: "NAMA" },
		{ field: "SATUAN", header: "SATUAN" },
		{ field: "HB", header: "HARGA BELI" },
	];

	const op = useRef(null);

	const onPage = (event) => {
		setlazyState(event);
	};

	useEffect(() => {
        loadFaktur();
		loadLazyData();
	}, [lazyState]);

	const refreshTabel = () => {
		let getLazyState = { ...lazyState };
		setlazyState(getLazyState);
	};

    const loadFaktur = async () => {
        try {
            const header = {
                'Content-Type': 'application/json;charset=UTF-8',
                'X-ENDPOINT': apiEndPointGetFaktur
            };
            const vaTable = await axios.post(apiDirPath, lazyState, { headers: header });
            const json = vaTable.data;
            return console.log(jsonMitra);
            setTotalRecords(json.total);
            setMitra(json.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };
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
	};

	const onInputNumberChange = (e, name) => {
		const val = e.value || 0;
		let _produk = { ...produk };
		_produk[`${name}`] = val;

		setProduk(_produk);
	};
	const onInputChange = (e, name) => {
		const val = (e.target && e.target.value) || "";
		let _produk = { ...produk };
		_produk[`${name}`] = val;
		setProduk(_produk);
		console.log(produk);
	};
	const setNull = () => {
		setKeteranganNamaProduk("");
		setKeteranganSatuan("");
		setKeteranganCustomer("");
		setKeteranganHarga("");
		setMitra({
			KODE: "",
			KODE_TOKO: "",
			NAMA: "",
			BARCODE: "",
			KETERANGAN: "",
			SATUAN: "",
		});
	};
	// ----------------------------------------------------------------------------------------------------------------- Hide Dialog
	const hideDialog = () => {
		setSubmitted(false);
		setAddMitraDialog(false);
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
		setAddMitraDialog(true);
		setStatusAction("store");
	};

	// -------------------------------------------------------------------------------------------------------------------- Func
	const saveAddMitra = async (e) => {
		e.preventDefault();
	};

	// Customer -----------------------------------------------------------------------------------------------------------
	const toggleCustomer = async (event) => {
		let indeks = null;
		let skipRequest = false;

		setCustomerDialog(true);
		setActiveIndex(event.index ?? 0);
		setLoadingItem(true);
		if (skipRequest === false) {
			const resCustomer = await dataTableCustomer(indeks);
			console.log(resCustomer);
			setCustomerTabel(resCustomer.data);
			// updateStateCustomer(indeks,resCustomer);
		}
		setLoadingItem(false);
	};

	const dataTableCustomer = (KODE) => {
		return new Promise((resolve) => {
			return fetch("/api/daftar_customer", {
				method: "POST",
				headers: { "Content-Type": "application/json", "X-ACTION": "get" },
				body: JSON.stringify({ KODE: KODE }),
			})
				.then((result) => result.json())
				.then((body) => {
					return resolve(body);
				});
			setCustomerDialog(true);
		});
	};

	const onRowSelectCustomer = (event) => {
		const selectedKode = event.data.KODE;
		const selectedCustomer = customerTabel.find((customer) => customer.KODE === selectedKode);

		if (selectedCustomer) {
			let _customer = { ...mitra };
			_customer.SUPPLIER = selectedCustomer.KODE;
			setMitra(_customer);

			setKeteranganCustomer(selectedCustomer.NAMA);
			console.log(mitra);
		}

		setCustomerDialog(false);
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
			console.log(resNamaProduk);
			setNamaProdukTabel(resNamaProduk.data);
			// updateStateNamaProduk(indeks,resNamaProduk);
		}
		setLoadingItem(false);
	};

	const dataTableNamaProduk = (KODE) => {
		return new Promise((resolve) => {
			return fetch("/api/produk", {
				method: "POST",
				headers: { "Content-Type": "application/json", "X-ACTION": "get" },
				body: JSON.stringify({ KODE: KODE }),
			})
				.then((result) => result.json())
				.then((body) => {
					return resolve(body);
				});
			setNamaProdukDialog(true);
		});
	};

	const onRowSelectNamaProduk = (event) => {
		const selectedKode = event.data.KODE;
		const selectedNamaProduk = namaProdukTabel.find((namaProduk) => namaProduk.KODE === selectedKode);

		if (selectedNamaProduk) {
			console.log(selectedNamaProduk);
			let _namaProduk = { ...mitra };
			_namaProduk.NAMA = selectedNamaProduk.NAMA;
			setMitra(_namaProduk);
			setKeteranganNamaProduk(selectedNamaProduk.NAMA);
			setKeteranganSatuan(selectedNamaProduk.SATUAN);
			setKeteranganHarga(selectedNamaProduk.HB);
			console.log(mitra);
		}

		setNamaProdukDialog(false);
	};

	// ---------------------------------------------------------------------------------------------------------------- Button
	const rightFooterTemplate = () => {
		return (
			<React.Fragment>
				<div className="my-2">
					<Button label="Delete" className="p-button-danger p-button-outlined mr-2" />
					<Button label="Save" className="p-button-primary p-button-outlined mr-2" />
					<Button
						label="Cancel"
						className="p-button-secondary p-button-outlined"
						onClick={() => {
							router.push("/penjualan/mitra-customer");
						}}
					/>
				</div>
			</React.Fragment>
		);
	};
	const addMitraFooter = (
		<>
			<Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
			<Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveAddMitra} />
		</>
	);

	return (
		<div className="grid crud-demo">
			<div className="col-12">
				{/* <BreadCrumb home={breadcrumbHome} model={breadcrumbItems} style={{ background: 'none', border: 'none' }} /> */}
				<div className="card">
					<h4>Add Penjualan Mitra/Customer</h4>
					<hr />
					<Toast ref={toast} />
					<div>
						<div className="formgrid grid">
							<div className="field col-12 mb-2 lg:col-6">
								<label htmlFor="faktur">Faktur</label>
								<div className="p-inputgroup">
									<InputText value={mitra.FAKTUR} onChange={(e) => onInputChange(e, "FAKTUR")} required className={classNames({ "p-invalid": submitted && !mitra.FAKTUR })} />
								</div>
							</div>
							<div className="field col-12 mb-2 lg:col-6">
								<label htmlFor="fakturasli">Faktur Asli</label>
								<div className="p-inputgroup">
									<InputText value={mitra.FAKTURASLI} onChange={(e) => onInputChange(e, "FAKTURASLI")} required autoFocus className={classNames({ "p-invalid": submitted && !mitra.FAKTURASLI })} />
									{/* {submitted && !mitra.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
								</div>
							</div>
						</div>
						<div className="formgrid grid">
							<div className="field col-12 mb-2 lg:col-3">
								<label htmlFor="tanggal">Tanggal</label>
								<div className="p-inputgroup">
									<Calendar value={mitra.TGL} id="tgl" showIcon dateFormat="dd-mm-yy" readOnlyInput />
								</div>
							</div>
							<div className="field col-12 mb-2 lg:col-3">
								<label htmlFor="tanggal">Jatuh Temmitra</label>
								<div className="p-inputgroup">
									<Calendar value={mitra.JTHTMP} id="jatuhtemmitra" showIcon dateFormat="dd-mm-yy" readOnlyInput />
								</div>
							</div>
							<div className="field col-12 mb-2 lg:col-3">
								<label htmlFor="discount">Discount</label>
								<div className="p-inputgroup">
									<InputText value={mitra.DISCOUNT} type="number" onChange={(e) => onInputChange(e, "DISCOUNT")} required className={classNames({ "p-invalid": submitted && !mitra.DISCOUNT })} />
									<Button icon="pi pi-percentage" className="p-button" readOnly />
								</div>
							</div>
							<div className="field col-12 mb-2 lg:col-3">
								<label htmlFor="ppn">Ppn</label>
								<div className="p-inputgroup">
									<InputText value={mitra.PPN} type="number" onChange={(e) => onInputChange(e, "PPN")} required className={classNames({ "p-invalid": submitted && !mitra.PPN })} />
									<Button icon="pi pi-percentage" className="p-button" readOnly />
								</div>
							</div>
						</div>
						<div className="formgrid grid">
							<div className="field col-12 mb-2 lg:col-5">
								<label htmlFor="customer">Customer</label>
								<div className="p-inputgroup">
									<InputText id="customer_kode" value={mitra.SUPPLIER} onChange={(e) => onInputChange(e, "SUPPLIER")} className={classNames({ "p-invalid": submitted && !mitra.SUPPLIER })} />
									<Button icon="pi pi-search" className="p-button" onClick={toggleCustomer} />
									<InputText readOnly id="ket-Customer" value={keteranganCustomer} />
								</div>
								{submitted && !mitra.SUPPLIER && <small className="p-invalid">Customer is required.</small>}
							</div>
							<div className="field col-12 mb-2 lg:col-5">
								<label htmlFor="kota">Alamat</label>
								<div className="p-inputgroup">
									<InputText value={mitra.ALAMAT} onChange={(e) => onInputChange(e, "KOTA")} required autoFocus className={classNames({ "p-invalid": submitted && !mitra.KOTA })} />
									{/* {submitted && !mitra.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
								</div>
							</div>
							<div className="field col-12 mb-2 lg:col-2">
								<label htmlFor="kota">Kota</label>
								<div className="p-inputgroup">
									<InputText value={mitra.KOTA} onChange={(e) => onInputChange(e, "KOTA")} required autoFocus className={classNames({ "p-invalid": submitted && !mitra.KOTA })} />
									{/* {submitted && !mitra.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
								</div>
							</div>
						</div>
					</div>
					<div className="my-2 text-right">
						<Button label="Add" className="p-button-primary p-button-sm mr-2" onClick={openAdd} />
					</div>
					<hr></hr>
					<DataTable
						// value={addMitra}
						lazy
						// dataKey="KODE"
						// paginator
						rows={10}
						className="datatable-responsive"
						first={lazyState.first}
						totalRecords={totalRecords}
						onPage={onPage}
						loading={loading}
					>
						<Column headerStyle={{ textAlign: "center" }} field="KODE" header="KODE"></Column>
						<Column headerStyle={{ textAlign: "center" }} field="NAMA" header="NAMA"></Column>
						<Column headerStyle={{ textAlign: "center" }} field="QTY" header="QTY"></Column>
						<Column headerStyle={{ textAlign: "center" }} field="SATUAN" header="SATUAN"></Column>
						<Column headerStyle={{ textAlign: "center" }} field="HARGA" header="HARGA"></Column>
						<Column headerStyle={{ textAlign: "center" }} field="DISCOUNT" header="DISCOUNT"></Column>
						<Column headerStyle={{ textAlign: "center" }} field="JUMLAH" header="JUMLAH"></Column>
						{/* <Column headerStyle={{ textAlign: "center" }} header="ACTION" body={actionBodyTemplate}></Column> */}
					</DataTable>
					<br></br>
					<div className="formgrid grid">
						<div className="field col-12 mb-2 lg:col-2">
							<label htmlFor="subtotal">Sub Total</label>
							<div className="p-inputgroup">
								<InputNumber mode="currency" currency="IDR" locale="id-ID" readOnly onChange={(e) => onInputNumberChange(e, "SUBTOTAL")} required autoFocus className={classNames({ "p-invalid": submitted && !mitra.SUBTOTAL })} />
								{/* {submitted && !mitra.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
							</div>
						</div>
						<div className="field col-12 mb-2 lg:col-1">
							<label htmlFor="discount">Discount</label>
							<div className="p-inputgroup">
								<InputText readOnly onChange={(e) => onInputChange(e, "DISCOUNT")} required autoFocus className={classNames({ "p-invalid": submitted && !mitra.DISCOUNT })} />
								{/* {submitted && !mitra.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
							</div>
						</div>
						<div className="field col-12 mb-2 lg:col-1">
							<label htmlFor="ppn">PPN</label>
							<div className="p-inputgroup">
								<InputText readOnly onChange={(e) => onInputChange(e, "PPN")} required autoFocus className={classNames({ "p-invalid": submitted && !mitra.PPN })} />
								{/* {submitted && !mitra.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
							</div>
						</div>
						<div className="field col-12 mb-2 lg:col-2">
							<label htmlFor="pembulatan">Pembulatan</label>
							<div className="p-inputgroup">
								<InputNumber mode="currency" currency="IDR" locale="id-ID" onChange={(e) => onInputNumberChange(e, "PEMBULATAN")} required autoFocus className={classNames({ "p-invalid": submitted && !mitra.PEMBULATAN })} />
								{/* {submitted && !mitra.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
							</div>
						</div>
						<div className="field col-12 mb-2 lg:col-2">
							<label htmlFor="total">Total</label>
							<div className="p-inputgroup">
								<InputNumber mode="currency" currency="IDR" locale="id-ID" readOnly onChange={(e) => onInputNumberChange(e, "TOTAL")} required autoFocus className={classNames({ "p-invalid": submitted && !mitra.TOTAL })} />
								{/* {submitted && !mitra.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
							</div>
						</div>
						<div className="field col-12 mb-2 lg:col-2">
							<label htmlFor="tunai">Tunai/Uang Muka</label>
							<div className="p-inputgroup">
								<InputNumber mode="currency" currency="IDR" locale="id-ID" onChange={(e) => onInputNumberChange(e, "TUNAI")} required autoFocus className={classNames({ "p-invalid": submitted && !mitra.TUNAI })} />
								{/* {submitted && !mitra.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
							</div>
						</div>
						<div className="field col-12 mb-2 lg:col-2">
							<label htmlFor="hutang">Hutang</label>
							<div className="p-inputgroup">
								<InputNumber mode="currency" currency="IDR" locale="id-ID" readOnly onChange={(e) => onInputNumberChange(e, "HUTANG")} required autoFocus className={classNames({ "p-invalid": submitted && !mitra.HUTANG })} />
								{/* {submitted && !mitra.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
							</div>
						</div>
					</div>
					<Toolbar className="mb-4" right={rightFooterTemplate}></Toolbar>

					{/* ------------------------------------------------------------------------------------------------------------------------- Dialog Customer */}
					<Dialog visible={customerDialog} style={{ width: "700px" }} header="Customer" modal className="p-fluid" onHide={hideDialogCustomer}>
						{loadingItem && <TabelSkaleton items={itemsSkelaton} kolom={columnsCustomer} />}
						{!loadingItem && (
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
								<Column headerStyle={{ textAlign: "center" }} field="KODE" header="KODE"></Column>
								<Column headerStyle={{ textAlign: "center" }} field="NAMA" header="NAMA"></Column>
								<Column headerStyle={{ textAlign: "center" }} field="ALAMAT" header="ALAMAT"></Column>
							</DataTable>
						)}
					</Dialog>

					{/* ------------------------------------------------------------------------------------------------------------------------- Dialog Add II */}
					<Dialog visible={addMitraDialog} style={{ width: "700px" }} header="Tambah Data " modal className="p-fluid" footer={addMitraFooter} onHide={hideDialog}>
						<div className="formgrid grid">
							<div className="field col-12 mb-2 lg:col-8">
								<label htmlFor="kode">Kode Barang</label>
								<div className="p-inputgroup">
									<InputText autoFocus id="namaProduk" value={mitra.NAMA} onChange={(e) => onInputChange(e, "NAMA")} required className={classNames({ "p-invalid": submitted && !mitra.NAMA })} />
									<Button icon="pi pi-search" className="p-button" onClick={toggleNamaProduk} />
									<InputText readOnly id="ket-produk" value={keteranganNamaProduk} />
								</div>
								{submitted && !mitra.KODE && <small className="p-invalid">Kode is required.</small>}
							</div>
							<div className="field col-12 mb-2 lg:col-4">
								<label htmlFor="keterangan">Satuan</label>
								<div className="p-inputgroup">
									{/* <InputText readOnly id="ket-produk" value={keteranganKodeSatuan} /> */}
									<InputText readOnly id="ket-Satuan" value={keteranganSatuan} />
								</div>
								{submitted && !mitra.KETERANGAN && <small className="p-invalid">Keterangan is required.</small>}
							</div>
							<div className="field col-12 mb-2 lg:col-2">
								<label htmlFor="qty">QTY</label>
								<div className="p-inputgroup">
									<InputText onChange={(e) => onInputChange(e, "QTY")} required autoFocus className={classNames({ "p-invalid": submitted && !mitra.QTY })} />
									{/* {submitted && !mitra.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
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
									<InputText onChange={(e) => onInputChange(e, "DISCOUNT")} required autoFocus className={classNames({ "p-invalid": submitted && !mitra.DISCOUNT })} />
									{/* {submitted && !mitra.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
								</div>
							</div>
							<div className="field col-12 mb-2 lg:col-3">
								<label htmlFor="ppn">PPN</label>
								<div className="p-inputgroup">
									<InputText onChange={(e) => onInputChange(e, "PPN")} required autoFocus className={classNames({ "p-invalid": submitted && !mitra.PPN })} />
									{/* {submitted && !mitra.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
								</div>
							</div>
							<div className="field col-12 mb-2 lg:col-12">
								<label htmlFor="harga">Jumlah Harga</label>
								<div className="p-inputgroup">
									<InputNumber mode="currency" currency="IDR" locale="id-ID" onChange={(e) => onInputNumberChange(e, "JMLHARGA")} required autoFocus className={classNames({ "p-invalid": submitted && !mitra.JMLHARGA })} />
									{/* {submitted && !mitra.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
								</div>
							</div>
						</div>
					</Dialog>

					{/* ----------------------------------------------------------------------------------------------------------------------- Dialog Nama Produk */}
					<Dialog visible={namaProdukDialog} style={{ width: "700px" }} header="Nama Produk" modal className="p-fluid" onHide={hideDialogNamaProduk}>
						{loadingItem && <TabelSkaleton items={itemsSkelaton} kolom={columnsNamaProduk} />}
						{!loadingItem && (
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
								<Column headerStyle={{ textAlign: "center" }} field="KODE" header="KODE"></Column>
								<Column headerStyle={{ textAlign: "center" }} field="NAMA" header="NAMA"></Column>
								<Column headerStyle={{ textAlign: "center" }} field="SATUAN" header="SATUAN"></Column>
								<Column headerStyle={{ textAlign: "center" }} field="HB" header="HARGA BELI"></Column>
							</DataTable>
						)}
					</Dialog>
				</div>
			</div>
		</div>
	);
}

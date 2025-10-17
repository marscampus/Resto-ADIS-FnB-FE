import getConfig from "next/config";
import axios from 'axios';
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
import { Dropdown } from "primereact/dropdown";
import { useRouter } from "next/router";
import { formatDateSave } from "../../../component/GeneralFunction/GeneralFunction"

export default function MasterMitra() {

    // PATH API
    const apiDirPath = '/api/api_crud_kode/';
    // API READ
    const apiEndPointGet = '/api/penjualanmitra/get';

	const toast = useRef(null);
	const [submitted, setSubmitted] = useState(false);
	const [loading, setLoading] = useState(false);
	const [loadingItem, setLoadingItem] = useState(false);
	const [totalRecords, setTotalRecords] = useState(0);
	const [selectAll, setSelectAll] = useState(false);
	const [selectedCoa, setSelectedCoa] = useState(null);
	const [activeIndex, setActiveIndex] = useState(0);
	const [mitra, setMitra] = useState([]);
	const [mitraDialog, setMitraDialog] = useState(false);
	const [dates, setDates] = useState([]);
	const [defaultOption, setDropdownValue] = useState(null);
	const [statusAction, setStatusAction] = useState(null);

	const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
	});
	const itemsSkelaton = Array.from({ length: 2 }, (v, i) => i);
	const columns = [{ field: "KODE", header: "KODE" }];

	const op = useRef(null);

	const onPage = (event) => {
		setlazyState(event);
	};

    const [dataLoaded, setDataLoaded] = useState(false);
	useEffect(() => {
		if (dates.length === 2 && !dataLoaded) {
            // Dates are available, and data has not been loaded yet
            loadLazyData();
          }
    }, [dates, dataLoaded, lazyState]);

	const refreshTabel = () => {
		let getLazyState = { ...lazyState };
		setlazyState(getLazyState);
	};

	const loadLazyData = async () => {
		setLoading(true);
        try {
            const formattedDates = handleRefresh();
            let requestBody = {
                START_DATE: formattedDates.START_DATE,
                END_DATE: formattedDates.END_DATE,
            };
            const header = {
                'Content-Type': 'application/json;charset=UTF-8',
                'X-ENDPOINT': apiEndPointGet
            };
            const vaTable = await axios.post(apiDirPath, requestBody, { headers: header });
            const jsonMitra = vaTable.data;
            // return console.log(jsonMitra);
            setTotalRecords(jsonMitra.total);
            setMitra(jsonMitra.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
	};
	// ----------------------------------------------------------------------------------------------------------------- Hide Dialog
	const hideDialog = () => {
		setSubmitted(false);
		setMitraDialog(false);
	};

	// -------------------------------------------------------------------------------------------------------------------- Dialog
	const router = useRouter();
	const openNew = () => {
		setMitra([]);
		setSubmitted(false);
		router.push("/penjualan/mitra-customer/add");
		setStatusAction("store");
	};

	// -------------------------------------------------------------------------------------------------------------------- Func
	const saveMitra = async (e) => {
		e.preventDefault();
	};

	// ---------------------------------------------------------------------------------------------------------------- Button
	const leftToolbarTemplate = () => {
		return (
			<React.Fragment>
				<div className="my-2" style={{ display: "flex", alignItems: "center" }}>
					<Button label="New" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew} />
				</div>
			</React.Fragment>
		);
	};
    const handleRefresh = () => {
        const formattedDates = {
          START_DATE: formatDateSave(dates[0]),
          END_DATE: formatDateSave(dates[1])
        };
        return formattedDates;
    };
	const rightToolbarTemplate = () => {
		return (
			<React.Fragment>
				<div className="my-2" style={{ display: "flex", alignItems: "center" }}>
					<div className="field">
						{/* <label>Range Tanggal</label> */}
						<div className="p-inputgroup">
							<Calendar value={dates} onChange={(e) => setDates(e.value)} selectionMode="range" placeholder="Range Tanggal" readOnlyInput dateFormat="dd-mm-yy"/>
							{/* <Button label="Refresh" icon="pi pi-refresh" className="p-button-primary mr-2" onClick={handleRefresh}/> */}
						</div>
					</div>
				</div>
			</React.Fragment>
		);
	};
	const mitraDialogFooter = (
		<>
			<Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
			<Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveMitra} />
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
		{ name: "KODE", label: "KODE" },
		{ name: "KETERANGAN", label: "KETERANGAN" },
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
				{/* <BreadCrumb home={breadcrumbHome} model={breadcrumbItems} style={{ background: 'none', border: 'none' }} /> */}
				<div className="card">
					<h4>Menu Penjualan Mitra/Customer</h4>
					<hr />
					<Toast ref={toast} />
					<Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>
					<DataTable
						value={mitra}
						lazy
						dataKey="KODE"
						paginator
						rows={10}
						className="datatable-responsive"
						first={lazyState.first}
						totalRecords={totalRecords}
						onPage={onPage}
						loading={loading}
						paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
						currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
						// header={headerSearch}
						filters={lazyState.filters}
						emptyMessage="Data Kosong"
					>
						<Column headerStyle={{ textAlign: "center" }} field="FAKTUR" header="FAKTUR"></Column>
						<Column headerStyle={{ textAlign: "center" }} field="FAKTURASLI" header="FAKTUR ASLI"></Column>
						<Column headerStyle={{ textAlign: "center" }} field="TGL" header="TANGGAL"></Column>
						<Column headerStyle={{ textAlign: "center" }} field="JTHTMP" header="JTH TMP"></Column>
						<Column headerStyle={{ textAlign: "center" }} field="CUSTOMER" header="CUSTOMER"></Column>
						<Column headerStyle={{ textAlign: "center" }} field="PIUTANG" header="PIUTANG"></Column>
						<Column headerStyle={{ textAlign: "center" }} field="TOTAL" header="TOTAL HARGA"></Column>
						{/* <Column headerStyle={{ textAlign: "center" }} header="ACTION" body={actionBodyTemplate}></Column> */}
					</DataTable>
					<Toolbar className="mb-4" left={preview}></Toolbar>

					{/* Dialog Mitra  */}
					<Dialog visible={mitraDialog} style={{ width: "700px" }} header="Tambah Penjualan Mitra/Customer " modal className="p-fluid" footer={mitraDialogFooter} onHide={hideDialog}>
						<div className="formgrid grid">
							<div className="field col-12 mb-2 lg:col-6">
								<label htmlFor="kode">Kode</label>
								<div className="p-inputgroup">
									<InputText disabled id="kode" value={mitra.KODE} onChange={(e) => onInputChange(e, "KODE")} className={classNames({ "p-invalid": submitted && !mitra.KODE })} />
								</div>
								{submitted && !mitra.KODE && <small className="p-invalid">Kode is required.</small>}
							</div>
							<div className="field col-12 mb-2 lg:col-6">
								<label htmlFor="keterangan">Keterangan</label>
								<InputText id="keterangan" value={mitra.Keterangan} onChange={(e) => onInputChange(e, "Keterangan")} required autoFocus className={classNames({ "p-invalid": submitted && !mitra.Keterangan })} />
								{submitted && !mitra.KETERANGAN && <small className="p-invalid">Keterangan is required.</small>}
							</div>
						</div>
					</Dialog>
				</div>
			</div>
		</div>
	);
}

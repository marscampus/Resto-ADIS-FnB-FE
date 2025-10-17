import { useRouter } from "next/router";
import postData from "../../../lib/Axios";
import { getSessionServerSide } from "../../../utilities/servertool";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Panel } from "primereact/panel";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { classNames } from "primereact/utils";
import { Toolbar } from "primereact/toolbar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { convertToISODate, showError, showSuccess } from "../../../component/GeneralFunction/GeneralFunction";

export const getServerSideProps = async (context) => {
  const sessionData = await getSessionServerSide(context, context.resolvedUrl);
  if (sessionData?.redirect) {
    return sessionData;
  }
  return {
    props: {},
  };
};

export default function MasterKonversi() {
  //hubungan dengan path api disini
  const apiEndPointGetData = "/api/posting/aktiva/data";
  const apiEndPointPostingAktiva = "/api/posting/aktiva/store";

  const router = useRouter();
  const toast = useRef(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tgl, setTgl] = useState(new Date());
  const [postingAktiva, setPostingAktiva] = useState([]);

  const [bulan, setBulan] = useState("");
  const [tahun, setTahun] = useState("");
  const [yearOptions, setYearOptions] = useState([]);
  const [aktiva, setAktiva] = useState([]);
  const [first, setFirst] = useState(0); // Halaman pertama
  const [rows, setRows] = useState(10); // Jumlah baris per halaman
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [showInputText, setShowInputText] = useState(false);
  const [cabangDialog, setCabangDialog] = useState(false);
  const [cabangTabel, setCabangTabel] = useState([]);
  const [loadingItem, setLoadingItem] = useState(false);
  const [jenisGabunganOptions, setJenisGabunganOptions] = useState([]);
  const months = [
    { label: "Januari", value: 1 },
    { label: "Februari", value: 2 },
    { label: "Maret", value: 3 },
    { label: "April", value: 4 },
    { label: "Mei", value: 5 },
    { label: "Juni", value: 6 },
    { label: "Juli", value: 7 },
    { label: "Agustus", value: 8 },
    { label: "September", value: 9 },
    { label: "Oktober", value: 10 },
    { label: "November", value: 11 },
    { label: "Desember", value: 12 },
  ];

  const [tglDialog, setTglDialog] = useState(false);

  const [lazyState, setlazyState] = useState({
    first: 0,
    rows: 10,
    page: 0,
    sortField: null,
    sortOrder: null,
    filters: {},
  });

  useEffect(() => {
    const jenisGabungan = async () => {
      try {
        const response = await getJenisGabungan();
        const data = await response;
        const fields = data.fields;
        setJenisGabunganOptions(fields);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const fetchData = async () => {
      try {
        // Set tahun
        const currentYear = new Date().getFullYear();
        const years = Array.from(
          { length: 20 },
          (_, index) => currentYear - index
        );
        const yearOptions = years.map((year) => ({
          label: year.toString(),
          value: year,
        }));
        setYearOptions(yearOptions);
        setTahun(currentYear);

        // Set bulan
        const currentMonth = new Date().getMonth() + 1;
        setBulan(currentMonth);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    jenisGabungan();
  }, [lazyState]);

  //------------------------------------------------------Cabang
  const toggleCabang = async (event) => {
    setLoadingItem(true);
    setCabangDialog(true);
    try {
      const vaTable = await pickGabungan(aktiva.JenisGabungan.name);
      setCabangTabel(vaTable);
    } catch (error) {
      console.error("Error while loading data:", error);
    } finally {
      setLoadingItem(false);
    }
  };

  const onRowSelectCabang = (event) => {
    const selectedKode = event.data.Kode;
    const selectedCabang = cabangTabel.find(
      (generalConfig) => generalConfig.Kode === selectedKode
    );
    if (selectedCabang) {
      let _cabang = { ...aktiva };
      _cabang.KodeCabang = selectedCabang.Kode;
      _cabang.KetCabang = selectedCabang.Keterangan;
      console.log(_cabang);
      setAktiva(_cabang);
    }
    setCabangDialog(false);
  };

  const onInputChange = (e, name) => {
    const val = (e.target && e.target.value) || "";
    let _aktiva = { ...aktiva };
    _aktiva[`${name}`] = val;
    setAktiva(_aktiva);
    if (name === "Bulan") {
      setBulan(val);
    }

    if (name === "Tahun") {
      const selectedYear = parseInt(val);
      setTahun(selectedYear);
    }

    if (name === "JenisGabungan" && val.name === "C") {
      setShowInputText(false);
    } else {
      if (jenisGabunganOptions.length >= 2) {
        setShowInputText(true);
      }
    }
  };

  const loadLazyData = async () => {
    setLoading(true);
    try {
      let requestBody = {
        Bulan: bulan,
        Tahun: tahun,
        Tgl: convertToISODate(tgl)
      };
      const vaTable = await postData(apiEndPointGetData, requestBody);
      const json = vaTable.data;
      setPostingAktiva(json.data);
    } catch (error) {
      console.error("Error while loading lazy data:", error);
    } finally {
      setLoading(false);
    }
  };
  // -------------------------------------------------------------------------------------------------------------------- Func

  // ---------------------------------------------------------------------------------------------------------------- Button
  const leftToolbarTemplate = () => {
    return (
      <React.Fragment>
        <div className="formgrid grid mb-2">
          <div className="field col-12">Tanggal</div>
          <div className="field col-12 flex items-center">
            <div className="field">
              <Calendar
                showIcon
                name="tgl"
                value={tgl}
                dateFormat="dd-mm-yy"
                disabled
              ></Calendar>
            </div>
          </div>
        </div>

        <div className="formgrid grid mb-2">
          <div className="field col-12">Periode Posting</div>
          <div className="field col-12 flex items-center">
            <div className="field">
              <Dropdown
                id="Bulan"
                name="Bulan"
                value={bulan}
                options={months}
                placeholder="Pilih Bulan"
                onChange={(e) => onInputChange(e, "Bulan")}
                optionLabel="label"
                optionValue="value" // Add this line to specify the 'value' property
                style={{ width: "100%", borderRadius: "5px" }}
              />
            </div>
            <div className="field">
              <Dropdown
                id="Tahun"
                name="Tahun"
                value={tahun}
                options={yearOptions}
                onChange={(e) => onInputChange(e, "Tahun")}
                placeholder="Pilih Tahun"
                className={classNames({
                  "p-invalid": submitted && !postingAktiva.Tahun,
                })}
                style={{ width: "100%", borderRadius: "5px" }}
              />
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <React.Fragment>
        <div className="formgrid grid mb-2">
          <div className="field">
            <Button
              label="Refresh"
              icon="pi pi-refresh"
              className="p-button-primary mr-2"
              onClick={loadLazyData}
            />
          </div>
        </div>
      </React.Fragment>
    );
  };

  const confirmTglDialog = () => {
    if (bulan == null && tahun == null) {
      toast.current.show({
        severity: "error",
        summary: "Error Message",
        detail: "Periode Belum Diatur",
        life: 3000,
      });
      return;
    }
    setTglDialog(true);
  };

  const handleProsesClick = async () => {
    setLoading(true);
    await handleData();
    setLoading(false);
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleData = async () => {
    const _data = {
      Bulan: bulan,
      Tahun: tahun,
      updJurnal: postingAktiva,
    };
    try {
      setIsLoading(true);
      const response = await postData(apiEndPointPostingAktiva, _data);
      const json = response.data;
      showSuccess(toast, json?.message);
    } catch (error) {
      let e = error?.response?.data || error;
      showError(toast, e?.message || 'Terjadi Kesalahan');
    }
    setIsLoading(false);
  };

  const hideTglDialog = () => {
    setTglDialog(false);
  };
  const tglFooter = (
    <>
      <Button label="No" icon="pi pi-times" text onClick={hideTglDialog} />
      <Button
        label="Yes"
        icon="pi pi-check"
        text
        onClick={() => {
          handleProsesClick(tgl);
          hideTglDialog(); // Sembunyikan dialog
        }}
      />
    </>
  );

  return (
    <div className="grid crud-demo">
      <div className="col-12">
        <div className="card">
          <h4>Posting Aktiva</h4>
          <hr />
          <Toast ref={toast} />
          <Panel header="Filter" toggleable>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <div className="formgrid grid" style={{ width: "100%" }}>
                {/* Tanggal Akutansi */}
                <div
                  className="field col-2 mb-2 lg:col-2"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <label style={{ marginBottom: "0" }}>Tanggal Akutansi</label>
                </div>
                <div className="field col-10 mb-2 lg:col-10">
                  <div
                    className="p-inputgroup"
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    <label style={{ marginBottom: "0", marginRight: "8px" }}>
                      :
                    </label>
                    <div
                      className="field col-2 mb-2 lg:col-2"
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      <Calendar
                        showIcon
                        name="tgl"
                        value={tgl}
                        dateFormat="dd-mm-yy"
                        disabled
                      ></Calendar>
                    </div>
                  </div>
                </div>
                {/* Periode */}
                <div
                  className="field col-2 mb-2 lg:col-2"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <label style={{ marginBottom: "0" }}>Periode</label>
                </div>
                <div className="field col-10 mb-2 lg:col-10">
                  <div
                    className="p-inputgroup"
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    <label style={{ marginBottom: "0", marginRight: "8px" }}>
                      :
                    </label>
                    <div
                      className="field col-2 mb-2 lg:col-2"
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      <div className="field">
                        <Dropdown
                          id="Bulan"
                          name="Bulan"
                          value={bulan}
                          options={months}
                          placeholder="Pilih Bulan"
                          onChange={(e) => onInputChange(e, "Bulan")}
                          optionLabel="label"
                          optionValue="value" // Add this line to specify the 'value' property
                          style={{ width: "100%", borderRadius: "5px" }}
                        />
                      </div>
                      <div className="field">
                        <Dropdown
                          id="Tahun"
                          name="Tahun"
                          value={tahun}
                          options={yearOptions}
                          onChange={(e) => onInputChange(e, "Tahun")}
                          placeholder="Pilih Tahun"
                          className={classNames({
                            "p-invalid": submitted && !postingAktiva.Tahun,
                          })}
                          style={{ width: "100%", borderRadius: "5px" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
          <Toolbar className="mb-4" right={rightToolbarTemplate}></Toolbar>
          <DataTable
            size="small"
            value={postingAktiva}
            lazy
            scrollable
            scrollHeight="500px"
            dataKey="ID"
            rows={10}
            className="datatable-responsive"
            loading={loading}
            emptyMessage="Data Kosong"
          >
            <Column
              field="Golongan"
              header="GOLONGAN"
              style={{ flexGrow: 1, flexBasis: "100px" }}
              alignFrozen="left"
            ></Column>
            <Column field="Keterangan" header="KETERANGAN"></Column>
            <Column
              body={(rowData) => {
                const value = rowData.Awal
                  ? parseFloat(rowData.Awal).toLocaleString()
                  : "";
                return value;
              }}
              header="AWAL"
            ></Column>
            <Column
              body={(rowData) => {
                const value = rowData.Penyusutan
                  ? parseFloat(rowData.Penyusutan).toLocaleString()
                  : "";
                return value;
              }}
              header="PENYUSUTAN"
            ></Column>
            <Column
              body={(rowData) => {
                const value = rowData.Akhir
                  ? parseFloat(rowData.Akhir).toLocaleString()
                  : "";
                return value;
              }}
              header="AKHIR"
            ></Column>
            <Column
              body={(rowData) => {
                const value = rowData.NilaiBuku
                  ? parseFloat(rowData.NilaiBuku).toLocaleString()
                  : "";
                return value;
              }}
              header="NILAI BUKU"
            ></Column>
          </DataTable>

          {/* Pop-up Loading */}
          {isLoading && (
            <div className="loading-popup">
              <i
                className="pi pi-spinner pi-spin"
                style={{ fontSize: "1.5em", marginRight: "8px" }}
              />
              <span style={{ marginLeft: "3px" }}>Loading...</span>
              <div style={{ marginTop: "15px" }}>
                <span>
                  Proses sedang berlangsung. Mohon tunggu hingga proses selesai.
                  <br />
                  Harap tidak menutup atau memuat ulang halaman ini.
                </span>
              </div>
            </div>
          )}

          {/* Tombol Proses */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "25px",
            }}
          >
            <Button
              label="Proses"
              className="p-button-primary mr-2"
              onClick={isLoading ? null : confirmTglDialog}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Dialog */}
        <Dialog
          visible={tglDialog}
          header="Confirm"
          modal
          footer={tglFooter}
          onHide={hideTglDialog}
        >
          <div className="flex align-items-center justify-content-center">
            <i
              className="pi pi-exclamation-triangle mr-3"
              style={{ fontSize: "2rem" }}
            />
            {bulan && tahun && <span>Apakah Periode Sudah Valid?</span>}
          </div>
        </Dialog>
        {/* Dialog Cabang */}
        <Dialog
          visible={cabangDialog}
          style={{ width: "700px" }}
          header="Cabang"
          modal
          className="p-fluid"
          onHide={() => setCabangDialog(false)}
        >
          {/* {headerHelperPopUp} */}
          <DataTable
            loading={loadingItem}
            size="small"
            value={cabangTabel}
            onRowSelect={onRowSelectCabang}
            selectionMode="single"
            // globalFilter={globalFilter}
            filter
            // filterOptions={filterOptions}
            filterMode="match"
            emptyMessage="Data Kosong"
          >
            <Column field="Kode" header="KODE" />
            <Column field="Keterangan" header="KETERANGAN" />
          </DataTable>
        </Dialog>
      </div>
    </div>
  );
}

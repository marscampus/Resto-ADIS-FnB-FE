/* eslint-disable */
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
import { resolve } from 'styled-jsx/css';
import { Checkbox } from 'primereact/checkbox';
import { Calendar } from 'primereact/calendar';

import axios from 'axios';
import { checkUserHadPlugins, getSessionServerSide } from '../../../../utilities/servertool';
import { useRouter } from 'next/router';
import postData from '../../../../lib/Axios';

export const getServerSideProps = async (context) => {
    const sessionData = await getSessionServerSide(context, '/pembukuan/aktiva');
    if (sessionData?.redirect) {
        return sessionData;
    }

    const { id } = context.params;
    return {
        props: {
            id
        }
    };
};

export default function addAktiva(id) {
    let emptyaktiva = {
        Kode: null,
        Nama: null,
        TglPerolehan: null,
        TglPenyusutan: null,
        TarifPenyusutan: null,
        HargaPerolehan: null,
        Unit: null,
        Golongan: null,
        JenisPenyusutan: null,
        Lama: null,
        Residu: null
    };

    //<Combobox Dialog>
    const [rekening1, setRekening1] = useState(null);
    const [GolAktivaDialog, setGolAktivaDialog] = useState(false);
    const [keteranganAgama, setketeranganAgama] = useState('');
    const [AgamaDialog, setAgamaDialog] = useState(false);
    const [keteranganGolAktiva, setketeranganGolAktiva] = useState('');
    const [KodyaKeteranganDialog, setKodyaKeteranganDialog] = useState(false);
    const [KelurahanKeteranganDialog, setKelurahanKeteranganDialog] = useState(false);
    const [KecamatanKeteranganDialog, setKecamatanKeteranganDialog] = useState(false);
    const itemsSkelaton = Array.from({ length: 2 }, (v, i) => i);
    const columns = [
        { field: 'Kode', header: 'Kode' },
        { field: 'Keterangan', header: 'Keterangan' }
    ];
    //</Combobox Dialog>

    const toast = useRef(null);
    const [aktiva, setAktiva] = useState([]);
    const [aktivaDialog, setAktivaDialog] = useState(false);
    const [aktivaTabel, setAktivaTabel] = useState([]);
    const [golonganDialog, setGolonganDialog] = useState(false);
    const [rakDialog, setRakDialog] = useState(false);
    const [gudangDialog, setGudangDialog] = useState(false);
    const [supplierDialog, setSupplierDialog] = useState(false);
    const [kadaluarsa, setKadaluarsa] = useState(false);
    const [satuan, setSatuan] = useState(null);
    const [satuanDialog, setSatuanDialog] = useState(false);
    const [satuan2Dialog, setSatuan2Dialog] = useState(false);
    const [satuan3Dialog, setSatuan3Dialog] = useState(false);
    const [namaAktivaDialog, setNamaAktivaDialog] = useState(false);
    const [keteranganNamaAktiva, setKeteranganNamaAktiva] = useState('');
    const [kode, setKode] = useState('');
    const [value, setValue] = useState('');
    const [items, setItems] = useState([]);
    const [date, setDate] = useState(null);

    const [statusAction, setStatusAction] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [namaAktivaTabel, setNamaAktivaTabel] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [detail, setDetail] = useState(null);
    const [harga, setHarga] = useState(null);
    const [hargaPromo, setHargaPromo] = useState(null);
    const [checkboxValue, setCheckboxValue] = useState([]);
    const [isChecked, setIsChecked] = useState(false);
    const [tglPerolehan, setTglPerolehan] = useState(new Date());
    const [TglPenyusutan, setTglPenyusutan] = useState(new Date());
    const [ingredients, setIngredients] = useState([]);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    //hubungan dengan path api disini
    const apiDirPath = '/api/_apibase_crud/';
    //create
    const apiEndPointStore = '/api/aktiva/store';
    //read
    const apiEndPointGet = '/api/aktiva/get';
    const apiEndPointGetGolAktiva = '/api/golonganaktiva/get';
    const apiEndPointGetEdit = '/api/aktiva/getdata_edit';
    //update
    const apiEndPointUpdate = '/api/aktiva/update/';
    //delete
    const apiEndPointDelete = '/api/aktiva/delete';
    //helper table
    const apiDirPathHelper = '/api/_apibase_helper/';
    const apiEndPointHelperRekening = '/api/golAktiva/get';

    const router = useRouter();
    const Kode = router.query.id;
    useEffect(() => {
        if (id) {
            let _aktiva = { ...aktiva };
            _aktiva[`Kode`] = Kode;
            console.log(_aktiva);
        }
    }, []);

    const funcEdit = async () => {
        setLoading(true);
        setAktiva({ ...aktiva });
        console.log(setAktiva);
    };

    //filter helper rekening
    const [globalFilter, setGlobalFilter] = useState('');
    const onFilterInput = (event) => {
        setGlobalFilter(event.target.value);
    };
    const clearFilter = () => {
        setGlobalFilter('');
    };

    const filterOptions = {
        global: { value: globalFilter, matchMode: 'contains' }
    };

    const showSuccess = (detail) => {
        toast.current.show({ severity: 'success', summary: 'Success Message', detail: detail, life: 3000 });
    };

    const showError = (detail) => {
        toast.current.show({ severity: 'error', summary: 'Error Message', detail: detail, life: 3000 });
    };

    const onInputDateChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        console.log(e);
        let _aktiva = { ...aktiva };
        console.log(_aktiva);

        const date = new Date(val);
        const formattedDate = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

        _aktiva[`${name}`] = formattedDate;
        setAktiva(_aktiva);
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || e.value;
        let _aktiva = { ...aktiva };
        _aktiva[`${name}`] = val;
        setAktiva(_aktiva);
        console.log(aktiva);
    };
    const onJenisPenyusutanChange = (e) => {
        let _aktiva = { ...aktiva };
        _aktiva['JenisPenyusutan'] = e.value;
        setAktiva(_aktiva);
    };
    const onSaldoMenurunChange = (e) => {
        let _aktiva = { ...aktiva };
        _aktiva['JenisPenyusutan'] = e.value;
        setAktiva(_aktiva);
    };

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    const loadLazyData = async () => {
        setLoading(true);

        try {
            // let res = await postData(apiDirPath, { Kode: id }, { headers: header });
            let res = await postData(apiEndPointGetEdit, { Kode: id });
            let data = res.data.data;
            setAktiva(data);
            console.log(data);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e.message);
        }

        setLoading(false);
    };

    const saveAktiva = async (e) => {
        e.preventDefault();
        let _aktiva = { ...aktiva };
        // return console.log(_aktivaTabel);
        let header = {};
        const index = findIndexById(aktiva.Kode);
        _aktiva[index] = _aktiva;

        //proses create / update data
        try {
            const vaProcess = await postData(apiEndPointUpdate, aktiva);
            let data = vaProcess.data;

            router.push('/pembukuan/aktiva');
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e.message);
        }
    };

    const findIndexById = (ID) => {
        let index = -1;
        for (let i = 0; i < aktivaTabel.length; i++) {
            if (aktivaTabel[i].ID === ID) {
                index = i;
                break;
            }
        }
        return index;
    };
    // const saveAktiva = async (e) => {
    //     e.preventDefault();

    //     // if (!validateFields()) {
    //     // toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Harap lengkapi form data Nasabah', life: 3000 });
    //     // return;
    //     // }

    //     let _aktivaTabel = [...aktivaTabel];
    //     let _aktiva = { ...aktiva };

    //     let header = {};
    //     let detail = null;
    //     if (statusAction == "update") {
    //     const index = findIndexById(aktiva.Kode);

    //     _aktivaTabel[index] = _aktiva;
    //     detail = "update data berhasil";
    //     header = { 'Content-Type': 'application/json;charset=UTF-8', 'X-ENDPOINT': apiEndPointUpdate, 'X-VALUEUPDATE': aktiva.Kode };
    //     } else {
    //     console.log(_aktiva);
    //     _aktivaTabel.push(_aktiva);
    //     detail = "data berhasil ditambahkan";
    //     header = { 'Content-Type': 'application/json;charset=UTF-8', 'X-ENDPOINT': apiEndPointStore, 'X-VALUEUPDATE': '' };
    //     }
    //     //proses create / update data
    //     console.log(aktiva);
    //     const vaProcess = await axios.post(apiDirPath, aktiva, { headers: header });
    //     let data = vaProcess.data;
    //     if (data.status == 'success') {
    //         toast.current.show({ severity: 'success', summary: 'Successful', detail: detail, life: 3000 });
    //         if (statusAction == 'update') {
    //             setAktivaTabel(_aktivaTabel);
    //             setAktiva(emptyaktiva);
    //         } else {
    //             refreshTabel();
    //         }
    //         router.push('/master/aktiva');
    //     } else {
    //         toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'kesalahan proses', life: 3000 });
    //     }
    //     };

    //------------------------------------------------------------------------------------------------------------------------------------------------------------------

    //--------------------------------------------------------------------------< Combobox GolAktiva >
    const onRowGolAktivaSelect = (event) => {
        const dataOnRow = event.data;
        setketeranganGolAktiva(dataOnRow.Keterangan);
        let _aktiva = { ...aktiva };
        _aktiva['Golongan'] = event.data.Kode;
        setAktiva(_aktiva);
        setGolAktivaDialog(false);
    };

    const [golAktivaTable, setGolAktivaTable] = useState(null);
    const toggleGolAktiva = async (event) => {
        let indeks = null;
        let skipRequest = false;

        setGolAktivaDialog(true);
        setLoadingItem(true);
        if (skipRequest === false) {
            // const res = await dataTableGolAktiva(indeks);

            try {
                let requestBody = { ...lazyState };
                let vaTable = await postData(apiEndPointGetGolAktiva, requestBody);
                const data = vaTable.data.data;
                setGolAktivaTable(data);
                console.log(data);
            } catch (error) {
                const e = error?.response?.data || error;
                showError(e.message);
            }
        }
        setLoadingItem(false);
    };

    //--------------------------------------------[HEADER HELPER]--------------------------------------------------
    const headerHelperPopUp = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"> </h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={onFilterInput} placeholder="Search..." />
                </span>
            </div>
        </div>
    );
    //------------------------------------------------------------------------------------------------------------------------------------------------------------------

    // Hide --------------------------------------------------------------------------------------------
    const hideDialog = () => {
        resetFields();
        setSubmitted(false);
        setAktivaDialog(false);
    };

    // ------------------------------------------------------------------------------------------------------ button
    const aktivaFooter = (
        <>
            <Button
                label="Cancel"
                icon="pi pi-times"
                className="p-button-text"
                onClick={() => {
                    router.push('/aktiva');
                }}
            />
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveAktiva} />
        </>
    );

    const refreshTabel = () => {
        let getLazyState = { ...lazyState };
        setlazyState(getLazyState);
    };

    return (
        <div className="card">
            <h4>Edit Master Aktiva</h4>
            <hr />
            <Toast ref={toast} />
            <div className="formgrid grid">
                <div className="field col-12 mb-2 lg:col-6">
                    <label htmlFor="kode">Kode</label>
                    <div className="p-inputgroup">
                        <InputText id="kode" readOnly value={aktiva?.Kode} onChange={(e) => onInputChange(e, 'Kode')} className={classNames({ 'p-invalid': submitted && !aktiva?.Kode })} />
                    </div>
                </div>
                <div className="field col-12 mb-2 lg:col-6">
                    <label htmlFor="nama">Nama</label>
                    <div className="p-inputgroup">
                        <InputText id="nama" value={aktiva?.Nama} onChange={(e) => onInputChange(e, 'Nama')} className={classNames({ 'p-invalid': submitted && !aktiva?.Nama })} />
                    </div>
                </div>
                <div className="field col-12 mb-2 lg:col-6">
                    <label htmlFor="TglPerolehan">Tgl Perolehan</label>
                    <div className="p-inputgroup">
                        <Calendar
                            id="tgl"
                            value={aktiva?.TglPerolehan ? new Date(aktiva?.TglPerolehan) : null}
                            onChange={(e) => onInputDateChange(e, 'TglPerolehan')}
                            className={classNames({
                                'p-invalid': submitted && !aktiva?.TglPerolehan
                            })}
                            showIcon
                            dateFormat="dd-mm-yy"
                        />
                    </div>
                </div>
                <div className="field col-12 mb-2 lg:col-6">
                    <label htmlFor="TglPenyusutan">Tgl Mulai Penyusutan</label>
                    <div className="p-inputgroup">
                        <Calendar
                            id="tgl"
                            value={aktiva?.TglPenyusutan ? new Date(aktiva?.TglPenyusutan) : null}
                            onChange={(e) => onInputDateChange(e, 'TglPenyusutan')}
                            className={classNames({
                                'p-invalid': submitted && !aktiva?.TglPenyusutan
                            })}
                            showIcon
                            dateFormat="dd-mm-yy"
                        />
                    </div>
                </div>
                <div className="field col-12 mb-2 lg:col-6">
                    <label htmlFor="Unit">Jumlah Unit</label>
                    <div className="p-inputgroup">
                        <InputText id="jumlahUnit" value={aktiva?.Unit} onChange={(e) => onInputChange(e, 'Unit')} className={classNames({ 'p-invalid': submitted && !aktiva?.Unit })} />
                    </div>
                </div>
                <div className="field col-12 mb-2 lg:col-6">
                    <label htmlFor="golongan">Golongan Aktiva</label>
                    <div className="p-inputgroup">
                        <InputText
                            style={{ width: '20%', borderRadius: '5px' }}
                            readOnly
                            id="golongan"
                            value={aktiva?.Golongan}
                            onChange={(e) => onInputChange(e, 'Golongan')}
                            className={classNames({
                                'p-invalid': submitted && !aktiva?.Golongan
                            })}
                        />
                        <Button
                            icon="pi pi-search"
                            className="p-button"
                            style={{
                                'margin-left': '5px',
                                'margin-right': '5px',
                                borderRadius: '5px'
                            }}
                            onClick={toggleGolAktiva}
                        />
                        <InputText style={{ width: '60%', borderRadius: '5px' }} readOnly id="ket-golAktiva" value={keteranganGolAktiva} />
                    </div>
                    {submitted && !aktiva?.GolAktiva && <small className="p-invalid">GolAktiva is required.</small>}
                </div>
                <div className="field-radiobutton col-6">
                    <RadioButton inputId="JenisPenyusutan" name="JenisPenyusutan" value="1" onChange={onJenisPenyusutanChange} checked={aktiva?.JenisPenyusutan === '1'} />
                    <label htmlFor="JenisPenyusutan">Garis Lurus</label>
                    <RadioButton style={{ marginLeft: '10px;' }} inputId="JenisPenyusutan" name="statusJenisPenyusutan" value="0" onChange={onSaldoMenurunChange} checked={aktiva?.JenisPenyusutan === '0'} />
                    <label htmlFor="JenisPenyusutan">Saldo Menurun</label>
                </div>
                <div className="field col-12 mb-2 lg:col-3">
                    <label htmlFor="Lama">Lama Penyusutan</label>
                    <div className="p-inputgroup">
                        <InputText id="Lama" value={aktiva?.Lama} onChange={(e) => onInputChange(e, 'Lama')} className={classNames({ 'p-invalid': submitted && !aktiva?.Lama })} />
                        &nbsp;
                        <Button label="bln" className="p-button" />
                    </div>
                </div>
                <div className="field col-12 mb-2 lg:col-3">
                    <label htmlFor="TarifPenyusutan">Tarif Penyusutan</label>
                    <div className="p-inputgroup">
                        <InputText
                            id="TarifPenyusutan"
                            value={aktiva?.TarifPenyusutan}
                            onChange={(e) => onInputChange(e, 'TarifPenyusutan')}
                            className={classNames({
                                'p-invalid': submitted && !aktiva?.TarifPenyusutan
                            })}
                        />
                        &nbsp;
                        <Button label="thn" className="p-button" />
                    </div>
                </div>
            </div>

            <div className="formgrid grid">
                <div className="field col-12 mb-2 lg:col-6">
                    <label htmlFor="HargaPerolehan">Harga Perolehan</label>
                    <div className="p-inputgroup">
                        <InputNumber
                            inputStyle={{ textAlign: 'right' }}
                            id="HargaPerolehan"
                            value={aktiva?.HargaPerolehan !== null ? aktiva?.HargaPerolehan : '-'}
                            onChange={(e) => onInputChange(e, 'HargaPerolehan')}
                            className={classNames({
                                'p-invalid': submitted && !aktiva?.HargaPerolehan
                            })}
                        />
                    </div>
                </div>
                <div className="field col-12 mb-2 lg:col-6">
                    <label htmlFor="Residu">Nilai Residu</label>
                    <div className="p-inputgroup">
                        <InputNumber
                            inputStyle={{ textAlign: 'right' }}
                            id="Residu"
                            value={aktiva?.Residu !== null ? aktiva?.Residu : '-'}
                            onChange={(e) => onInputChange(e, 'Residu')}
                            className={classNames({
                                'p-invalid': submitted && !aktiva?.Residu
                            })}
                        />
                    </div>
                </div>
                {/* <div className="field col-12 mb-2 lg:col-4">
                    <label htmlFor="HargaPerolehan">Nilai Penyusutan</label>
                    <div className="p-inputgroup">
                        <InputNumber
                            inputStyle={{ textAlign: 'right' }}
                            id="HargaPerolehan"
                            value={aktiva?.NilaiPenyusutan !== null ? aktiva?.NilaiPenyusutan : '-'}
                            onChange={(e) => onInputChange(e, 'NilaiPenyusutan')}
                            className={classNames({
                                'p-invalid': submitted && !aktiva?.HargaPerolehan
                            })}
                        />
                    </div>
                </div> */}
            </div>
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        label="Cancel"
                        icon="pi pi-times"
                        className="p-button-text"
                        onClick={() => {
                            router.push('/pembukuan/aktiva');
                        }}
                    />
                    <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveAktiva} />
                    <Dialog visible={GolAktivaDialog} header="Golongan Aktiva" modal className="p-fluid" onHide={() => setGolAktivaDialog(false)} style={{ width: '700px' }}>
                        {loadingItem && <TabelSkaleton items={itemsSkelaton} kolom={columns} />}
                        {!loadingItem && (
                            <DataTable
                                value={golAktivaTable}
                                onRowSelect={onRowGolAktivaSelect}
                                selectionMode="single"
                                dataKey="ID"
                                paginator
                                rows={10}
                                header={headerHelperPopUp}
                                globalFilter={globalFilter}
                                filter
                                filterOptions={filterOptions}
                                filterMode="match"
                                emptyMessage="Data Kosong"
                            >
                                <Column field="Kode" header="Kode" />
                                <Column field="Keterangan" header="Keterangan" />
                            </DataTable>
                        )}
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
// export default AddPage;

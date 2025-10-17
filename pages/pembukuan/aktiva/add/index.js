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
import { AutoComplete } from 'primereact/autocomplete';

// import CameraCapture from '../../component/captureCamera';
import { BreadCrumb } from 'primereact/breadcrumb';
import Link from 'next/link';
import { useRouter } from 'next/router';
import postData from '../../../../lib/Axios';
import { checkUserHadPlugins, getSessionServerSide } from '../../../../utilities/servertool';

// const [showModal, setShowModal] = useState(false);
// const handleSearchButtonClick = () => {
//     setShowModal(false)
// };

export const getServerSideProps = async (context) => {
    const sessionData = await getSessionServerSide(context, '/pembukuan/aktiva');
    if (sessionData?.redirect) {
        return sessionData;
    }

    return {
        props: {}
    };
};

export default function addAktiva() {
    //<Combobox Dialog>
    const [rekening1, setRekening1] = useState(null);
    const [rekening2, setRekening2] = useState(null);
    const [rekening3, setRekening3] = useState(null);
    const [rekening4, setRekening4] = useState(null);
    const [rekening5, setRekening5] = useState(null);
    const [rekening6, setRekening6] = useState(null);
    const [GolAktivaDialog, setGolAktivaDialog] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const [keteranganRekeningAkuntansi, setketeranganRekeningAkuntansi] = useState('');
    const [keteranganAktiva, setketeranganAktiva] = useState('');
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
    // const [aktiva, setAktiva] = useState(emptyaktiva);
    const [aktivaDialog, setAktivaDialog] = useState(false);
    const [aktivaTabel, setAktivaTabel] = useState([]);
    const [golongansimpananberjangkaDialog, setgolongansimpananberjangkaDialog] = useState(false);
    const [keteranganRekeningPajakBunga, setketeranganRekeningPajakBunga] = useState('');
    const [deleteGolonganSimpananBerjangkaDialog, setDeleteGolonganSimpananBerjangkaDialog] = useState(false);

    const [kadaluarsa, setKadaluarsa] = useState(false);
    const [rekeningAkuntansiDialog, setRekeningAkuntansiDialog] = useState(false);
    const [rekeningJatuhTempoDialog, setRekeningJatuhTempoDialog] = useState(false);
    const [CadanganBungaDialog, setCadanganBungaDialog] = useState(false);
    const [rekeningPinaltiDialog, setRekeningPinaltiDialog] = useState(false);
    const [satuan, setSatuan] = useState(null);
    const [satuanDialog, setSatuanDialog] = useState(false);
    const [keteranganRekeningDebet, setketeranganRekeningDebet] = useState('');
    const [keteranganRekeningKredit, setketeranganRekeningKredit] = useState('');
    const [rekeningDebetDialog, setRekeningDebetDialog] = useState(false);
    const [rekeningKreditDialog, setRekeningKreditDialog] = useState(false);
    const [namaAktivaDialog, setNamaAktivaDialog] = useState(false);
    const [keteranganCadanganBunga, setketeranganCadanganBunga] = useState('');
    const [keteranganRekeningPinalti, setketeranganRekeningPinalti] = useState('');
    const [keteranganRekeningJatuhTempo, setketeranganRekeningJatuhTempo] = useState('');
    const [rekeningPajakBungaDialog, setRekeningPajakBungaDialog] = useState(false);
    const [aktiva, setAktiva] = useState([]);
    const [items, setItems] = useState([]);
    const [date, setDate] = useState(null);
    const [statusAction, setStatusAction] = useState(null);
    const [deleteAktivaDialog, setDeleteAktivaDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [namaAktivaTabel, setNamaAktivaTabel] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [detail, setDetail] = useState(null);
    const [harga, setHarga] = useState(null);
    const [hargaPromo, setHargaPromo] = useState(null);
    const [checkboxValue, setCheckboxValue] = useState([]);
    const [isChecked, setIsChecked] = useState(false);
    const [ingredients, setIngredients] = useState([]);
    const [faktur, setFaktur] = useState(null);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    //hubungan dengan path api disini
    //create
    const apiEndPointStore = '/api/aktiva/store';

    const apiEndPointGetGolAktiva = '/api/golonganaktiva/get';

    const showSuccess = (detail) => {
        toast.current.show({ severity: 'success', summary: 'Success Message', detail: detail, life: 3000 });
    };

    const showError = (detail) => {
        toast.current.show({ severity: 'error', summary: 'Error Message', detail: detail, life: 3000 });
    };

    //filter helper rekening
    const [globalFilter, setGlobalFilter] = useState('');
    const onFilterInput = (event) => {
        setGlobalFilter(event.target.value);
    };

    const filterOptions = {
        global: { value: globalFilter, matchMode: 'contains' }
    };
    const saveAktiva = async (e) => {
        try {
            e.preventDefault();
            // if (!validateFields()) {
            // toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Harap lengkapi form data Nasabah', life: 3000 });
            // return;
            // }
            let _aktivaTabel = [...aktivaTabel];
            let _aktiva = { ...aktiva };

            let header = {};
            let detail = null;
            _aktivaTabel.push(_aktiva);

            //proses create / update data
            // return console.log(aktiva);
            const vaProcess = await postData(apiEndPointStore, aktiva);
            let data = vaProcess.data;
            showSuccess(data.message);
            router.push('/pembukuan/aktiva');
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e.message);
        }
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
        console.log(val);

        setNamaError('');
        setAlamatError('');
        setKTPError('');
    };

    //--------------------------------------------------------------------------< Combobox GolAktiva >
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

        setLoadingItem(false);
    };

    //--------------------------------------------[HEADER HELPER]-
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
    //------------------------------------------ END OF DROPDOWN COMPONENT ------------------------------------------
    // ------------------------------------------------------------------------------------------------------ button
    const router = useRouter();
    const aktivaFooter = (
        <div>
            <Button
                label="Cancel"
                icon="pi pi-times"
                className="p-button-text"
                onClick={() => {
                    router.push('/pembukuan/aktiva');
                }}
            />
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveAktiva} />
        </div>
    );

    const refreshTabel = () => {
        let getLazyState = { ...lazyState };
        setlazyState(getLazyState);
    };

    //----------------------------------------------------------------------------- VALIDATOR -----------------------------------------------------------------------------

    // AutoFocus ke komponen yang tidak valid
    const UseFocus = () => {
        const htmlElRef = useRef(null);
        const setFocus = () => {
            htmlElRef.current && htmlElRef.current.focus();
        };
        return [htmlElRef, setFocus];
    };

    const [namaError, setNamaError] = useState('');
    const [alamatError, setAlamatError] = useState('');
    const [ktpError, setKTPError] = useState('');

    //----------------------------------------------------------------------------- END OF VALIDATOR -----------------------------------------------------------------------------

    return (
        <div className="card">
            <h4>Add Master Aktiva</h4>
            <hr />
            <Toast ref={toast} />
            <div className="formgrid grid">
                <div className="field col-12 mb-2 lg:col-6">
                    <label htmlFor="kode">Kode</label>
                    <div className="p-inputgroup">
                        <InputText id="kode" value={aktiva?.Kode} placeholder="contoh : 0001" onChange={(e) => onInputChange(e, 'Kode')} className={classNames({ 'p-invalid': submitted && !aktiva?.Kode })} />
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
                        <InputText style={{ width: '60%', borderRadius: '5px' }} readOnly id="ket-polAktiva" value={keteranganGolAktiva} />
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
                            value={aktiva?.HargaPerolehan}
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
                            value={aktiva?.Residu}
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
                            value={aktiva?.NilaiPenyusutan}
                            onChange={(e) => onInputChange(e, 'HargaPerolehan')}
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

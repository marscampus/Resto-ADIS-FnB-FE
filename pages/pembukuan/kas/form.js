/* eslint-disable */
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { Calendar } from 'primereact/calendar';
import { useRouter } from 'next/router';
import { getSessionServerSide } from '../../../utilities/servertool';
import { convertToISODate, getKeterangan, showError, showSuccess } from '../../../component/GeneralFunction/GeneralFunction';
import postData from '../../../lib/Axios';
import MultipleRekeningCOA from '../../component/multipleRekeningCOA';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, '/pembukuan/kas');
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function Form() {
    const [urutTabel, setUrutTabel] = useState(0);
    const [totalNominal, setTotalNominal] = useState(0);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [activeFormField, setActiveFormField] = useState(null);
    const apiEndPoinGetFaktur = '/api/get_faktur';
    const apiEndPointStore = '/api/kas/store';
    const apiEndPointUpdate = '/api/kas/update';
    const apiEndPointGetDataEdit = '/api/kas/get-data';

    let emptypenerimaankas = {
        ID: null,
        Faktur: null,
        Tgl: null,
        Rekening: null,
        KeteranganRekening: null,
        Jumlah: null,
        Keterangan: null
    };

    const toast = useRef(null);
    const router = useRouter();

    const [tglTransaksi, setTglTransaksi] = useState(new Date());
    const [faktur, setFaktur] = useState('');
    const [kas, setKas] = useState([emptypenerimaankas]);
    const [kasDetail, setKasDetail] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [rekeningDialog, setRekeningDialog] = useState(false);
    const [readOnlyEdit, setReadOnlyEdit] = useState(false);
    const { status, jenis } = router.query;
    const formattedJenis = jenis === 'penerimaan' ? 'Penerimaan ' : 'Pengeluaran';
    const formattedStatus = status === 'create' ? 'Tambah ' : 'Ubah ';
    const keteranganHeader = jenis === 'penerimaan' ? 'KETERANGAN KREDIT ' : 'KETERANGAN DEBET';
    const jumlahHeader = jenis === 'penerimaan' ? 'JUMLAH KREDIT ' : 'JUMLAH DEBET';
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    const [inputData, setInputData] = useState({
        No: null,
        Rekening: null,
        KeteranganRekening: null,
        Keterangan: null,
        Jumlah: null
    });

    useEffect(() => {
        const { status } = router.query;
        const Faktur = localStorage.getItem('Faktur');
        if (status === 'update') {
            setFaktur(Faktur);
            getDataEdit();
            setReadOnlyEdit(true);
            setIsUpdateMode(true);
        } else {
            loadLazyData();
            setIsUpdateMode(false);
        }
        // getRekKas();
        loadTglTransaksi();
    }, [lazyState]);

    const onPage = () => { };

    const initRoute = () => {
        router.push('/pembukuan/kas/');
    };

    const nominalBodyTemplate = (rowData) => {
        let formattedValue = 0;
        if (rowData.Jumlah === 0) {
            formattedValue = '';
        } else {
            formattedValue = rowData.Jumlah.toLocaleString('id-ID', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
        return formattedValue;
    };

    const onInputDebetChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _kas = { ...kas };
        _kas[name] = val;
        _kas[`Faktur`] = faktur;
        setKas(_kas);
        setJumlahError('');
        setRekeningError('');
        setKeteranganError('');

        setJumlahDebetError('');
        setRekeningDebetError('');
        setKeteranganDebetError('');
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _inputData = { ...inputData };
        _inputData[name] = val;
        setInputData(_inputData);

        setJumlahError('');
        setRekeningError('');
        setKeteranganError('');

        setJumlahDebetError('');
        setRekeningDebetError('');
        setKeteranganDebetError('');
    };

    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        let _inputData = { ...inputData };
        _inputData[name] = val;
        setInputData(_inputData);

        setJumlahError('');
        setRekeningError('');
        setKeteranganError('');

        setJumlahDebetError('');
        setRekeningDebetError('');
        setKeteranganDebetError('');
    };

    const createDataObject = (_penerimaanKas, _detail) => {
        return {
            Faktur: faktur,
            Tgl: convertToISODate(tglTransaksi),
            Rekening: _penerimaanKas.RekeningKas,
            Keterangan: _penerimaanKas.Keterangan,
            Total: totalNominal,
            detail: _detail.map((item) => ({
                Rekening: item.Rekening,
                Keterangan: item.Keterangan,
                Jumlah: item.Jumlah
            }))
        };
    };

    const savePenerimaanKasKredit = async (e) => {
        e.preventDefault();
        setLoading(true);

        let _penerimaanKas = { ...kas };
        let _detail = [...kasDetail];
        let _data = createDataObject(_penerimaanKas, _detail);

        if (!_data.Faktur) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Faktur Masih Kosong!', life: 3000 });
            return;
        }

        if (!_data.Tgl) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tanggal Masih Kosong!', life: 3000 });
            return;
        }

        if (!_data.Rekening) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Rekening Kas Masih Kosong!', life: 3000 });
            return;
        }

        if (_data.Total <= 0) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Mutasi Masih Kosong!', life: 3000 });
            return;
        }

        try {
            let endPoint;
            if (isUpdateMode) {
                endPoint = apiEndPointUpdate;
            } else {
                endPoint = apiEndPointStore;
            }
            const vaData = await postData(endPoint, _data);
            const json = vaData.data;
            showSuccess(toast, json?.message)
            setTimeout(() => {
                router.push('/pembukuan/kas');
            }, 2000);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const rightToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div id="tombolSimpanBatal">
                    <Button label="Simpan" icon="pi pi-check" className="p-button-info mr-2" loading={loading} onClick={savePenerimaanKasKredit} />
                    <Button label="Batal" icon="pi pi-times" className="p-button-info mr-2" onClick={initRoute} />
                </div>
            </React.Fragment>
        );
    };

    const onInputDateChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _kas = { ...kas };

        const date = new Date(val);
        const formattedDate = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

        _kas[`${name}`] = formattedDate;
        setKas(_kas);

        setJumlahDebetError('');
        setRekeningDebetError('');
        setKeteranganDebetError('');
    };

    const [rekeningError, setRekeningError] = useState('');
    const [keteranganError, setKeteranganError] = useState('');
    const [jumlahError, setJumlahError] = useState('');

    const [rekeningDebetError, setRekeningDebetError] = useState('');
    const [keteranganDebetError, setKeteranganDebetError] = useState('');
    const [jumlahDebetError, setJumlahDebetError] = useState('');

    const validateTabel = () => {
        const errors = {
            Rekening: !inputData.Rekening ? 'Rekening harus diisi' : '',
            Keterangan: !inputData.Keterangan ? 'Keterangan Harus diisi.' : '',
            Jumlah: !inputData.Jumlah ? 'Total Harus diisi.' : ''
        };

        setRekeningError(errors.Rekening);
        setKeteranganError(errors.Keterangan);
        setJumlahError(errors.Jumlah);

        return Object.values(errors).every((error) => !error);
    };

    const loadLazyData = async () => {
        loadFaktur();
    };

    const getDataEdit = async () => {
        setLoading(true);
        const Faktur = localStorage.getItem('Faktur');
        try {
            let requestBody = {
                Faktur: Faktur
            };
            const vaData = await postData(apiEndPointGetDataEdit, requestBody);
            const json = vaData.data;

            // Tambahkan nomor urut ke detail berdasarkan indeks array
            const updatedDetail = json.data.detail.map((item, index) => ({
                ...item,
                No: index + 1 // Menambahkan kolom No
            }));

            // Hitung total nominal dari kolom Jumlah di kasDetail
            const totalNominal = updatedDetail.reduce((acc, curr) => acc + curr.Jumlah, 0);

            // Set state
            setKas(json.data);
            setTglTransaksi(new Date(json.data.Tgl));
            setKasDetail(updatedDetail);
            setTotalNominal(totalNominal); // Update total nominal
            setUrutTabel(updatedDetail.length); // Set urut tabel ke panjang data yang sudah ada
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const setNull = () => {
        // Reset hanya input di header, tanpa memengaruhi data tabel
        setInputData({
            Rekening: '',
            KetRekening: '',
            Keterangan: '',
            Jumlah: ''
        });

        setKas((prevKas) => ({
            ...prevKas,
            RekeningKredit: '',
            KetRekeningKredit: ''
        }));
    };

    const addIsiTabel = async (e) => {
        e.preventDefault();

        if (!validateTabel()) {
            toast.current.show({
                severity: 'error',
                summary: 'Error Message',
                detail: 'Harap lengkapi form data ',
                life: 3000
            });
            return;
        }

        try {
            const newNo = kasDetail.length + 1;

            const newData = {
                No: newNo,
                Rekening: inputData.Rekening,
                KeteranganRekening: inputData.KetRekening,
                Keterangan: inputData.Keterangan,
                Jumlah: inputData.Jumlah
            };

            const updatedDetail = [...kasDetail, newData];

            // Hitung total nominal baru
            const newTotalNominal = updatedDetail.reduce((acc, curr) => acc + curr.Jumlah, 0);

            setKasDetail(updatedDetail);
            setTotalNominal(newTotalNominal); // Update total nominal
            setUrutTabel(newNo);
            setNull();
        } catch (error) {
            console.error('Error saat menambahkan data ke tabel:', error);
        }
    };

    const loadFaktur = async () => {
        setLoading(true);
        try {
            let requestBody = {
                Kode: jenis === 'penerimaan' ? 'KM' : 'KK',
                Len: '6'
            };
            const vaTable = await postData(apiEndPoinGetFaktur, requestBody);
            const json = vaTable.data;
            setFaktur(json);
            const val = json || '';
            let _kas = { ...kas };
            _kas[`Faktur`] = val;
            setKas(_kas);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
        setLoading(false);
    };

    const loadTglTransaksi = async () => {
        setTglTransaksi(new Date());
    };

    //  Yang Handle Rekening
    const handleSearchButtonClick = (formField) => {
        return (event) => {
            setActiveFormField(formField);
            setRekeningDialog(true);
        };
    };

    const onRowSelectKode = (event, formField) => {
        const selectedRow = event.data;
        if (selectedRow.jenis_rekening == 'I') {
            showError(toast, 'Rekening Induk Tidak Dapat Dipilih');
            setKas((p) => ({
                ...p
            }));
        } else {
            //  Menentukan FormField yang Sesuai
            switch (formField) {
                // ----------------------------------Pembelian
                case 'RekeningKas':
                    setKas((p) => ({
                        ...p,
                        RekeningKas: selectedRow.kode,
                        KetRekeningKas: selectedRow.keterangan
                    }));
                    break;
                case 'Rekening':
                    setInputData((p) => ({
                        ...p,
                        Rekening: selectedRow.kode,
                        KetRekening: selectedRow.keterangan
                    }));
                    break;
                default:
                    break;
            }
        }
        setRekeningDialog(false);
    };

    // Yang Handle Hapus Row Data
    const deleteSelectedRow = (rowData) => {
        // Hapus baris yang dipilih dari kasDetail
        const updatedKasDetail = kasDetail.filter((row) => row !== rowData);

        // Kurangi nilai `Jumlah` dari total nominal
        const jumlahToRemove = parseInt(rowData['Jumlah']);
        setTotalNominal(totalNominal - jumlahToRemove);

        // Perbarui objek kas
        const updatedPenerimaanKas = {
            ...kas,
            Jumlah: totalNominal - jumlahToRemove
        };
        setKas(updatedPenerimaanKas);

        // Perbarui data kasDetail
        setKasDetail(updatedKasDetail);
    };

    const actionBodyTabel = (rowData) => {
        return (
            <>
                <Button icon="pi pi-trash" style={{ backgroundColor: '#ca656f', border: '1px solid #ca656f' }} className="p-button-danger p-button p-button-sm mr-2" onClick={() => deleteSelectedRow(rowData)} />
            </>
        );
    };



    const header = (
        <div className="formgrid grid">
            <div className="field col-1 mb-1 lg:col-1">
                <label htmlFor="no">No.</label>
                <div className="p-inputgroup">
                    <InputText id="no" value={1 + urutTabel} Name="no" onChange={(e) => onInputChange(e, 'No')} required readOnly />
                </div>
            </div>
            <div className="field col-3 mb-3 lg:col-3">
                <label htmlFor="rekening">Rekening</label>
                <div className="p-inputgroup">
                    <InputText id="rekeningkredit" value={inputData.Rekening} onChange={(e) => onInputChange(e, 'Rekening')} />
                    <Button icon="pi pi-search" className="p-button"
                        style={{ marginLeft: '3px', marginRight: '3px', borderRadius: '5px' }}
                        onClick={handleSearchButtonClick('Rekening')} />
                    <InputText readonly id="ket-Satuan" value={inputData.KetRekening} />
                </div>
                <small className="p-invalid" style={{ color: 'red' }}>
                    {rekeningError}
                </small>
            </div>
            <div className="field col-4 mb-4 lg:col-4">
                <label htmlFor="keteranganrekening">Keterangan</label>
                <div className="p-inputgroup">
                    <InputText id="keteranganrekening" value={inputData.Keterangan} onChange={(e) => onInputChange(e, 'Keterangan')} Name="keterangan" required />
                </div>
                <small className="p-invalid" style={{ color: 'red' }}>
                    {keteranganError}
                </small>
            </div>
            <div className="field col-3 mb-2 lg:col-2">
                <label htmlFor="total">Total</label>
                <div className="p-inputgroup">
                    <InputNumber inputStyle={{ textAlign: 'right' }} id="jumlah" Name="jumlah" value={inputData.Jumlah} onChange={(e) => onInputNumberChange(e, 'Jumlah')} required />
                </div>
                <small className="p-invalid" style={{ color: 'red' }}>
                    {jumlahError}
                </small>
            </div>
            <div className="field col-2 mb-2 lg:col-2">
                <label htmlFor="kode">&nbsp;</label>
                <div className="p-inputgroup">
                    <Button label="OK" severity="success" className="mr-2" onClick={addIsiTabel} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>{`${formattedStatus} ${formattedJenis} Kas`}</h4>
                    <hr />
                    <Toast ref={toast} />
                    <div className="formgrid grid">
                        <div className="field col-12 mb-2 lg:col-3">
                            <label htmlFor="kode">Faktur</label>
                            <div className="p-inputgroup">
                                <InputText style={{ borderRadius: '6px' }} id="fakturTambah" Name="faktur" value={faktur} onChange={(e) => onInputDebetChange(e, 'Faktur')} />
                            </div>
                        </div>
                        <div className="field col-12 mb-2 lg:col-3">
                            <label htmlFor="kode">Tanggal</label>
                            <div className="p-inputgroup">
                                <Calendar id="tgl" value={tglTransaksi} onChange={(e) => onInputDateChange(e, 'Tgl')} showIcon dateFormat="dd-mm-yy" disabled={readOnlyEdit} />
                            </div>
                        </div>
                        <div className="field col-12 mb-2 lg:col-6">
                            <label htmlFor="kode">Rekening Kas</label>
                            <div className="p-inputgroup">
                                <InputText style={{ width: '30%', borderRadius: '5px' }} readOnly id="rekening" value={kas.RekeningKas} onChange={(e) => onInputDebetChange(e, 'RekeningKas')} />
                                <Button icon="pi pi-search" className="p-button"
                                    style={{ marginLeft: '3px', marginRight: '3px', borderRadius: '5px' }}
                                    onClick={handleSearchButtonClick('RekeningKas')} />
                                <InputText style={{ width: '60%', borderRadius: '5px' }} readonly id="ket-Satuan" value={kas.KetRekeningKas} />
                            </div>
                            <small className="p-invalid" style={{ color: 'red' }}>
                                {rekeningDebetError}
                            </small>
                        </div>
                        <div className="field col-12 mb-2 lg:col-8">
                            <label htmlFor="kode">Keterangan</label>
                            <div className="p-inputgroup">
                                <InputText id="keterangandebet" Name="Faktur" value={kas.Keterangan} onChange={(e) => onInputDebetChange(e, 'Keterangan')} />
                            </div>
                            <small className="p-invalid" style={{ color: 'red' }}>
                                {keteranganDebetError}
                            </small>
                        </div>
                        <div className="field col-12 mb-2 lg:col-4">
                            <label htmlFor="kode">Total</label>
                            <div className="p-inputgroup">
                                <InputNumber inputStyle={{ textAlign: 'right' }} id="total" Name="total" value={totalNominal} readOnly />
                            </div>
                            <small className="p-invalid" style={{ color: 'red' }}>
                                {jumlahDebetError}
                            </small>
                        </div>
                    </div>
                    <hr />

                    <DataTable
                        size="small"
                        id="tabelKas"
                        value={kasDetail}
                        lazy
                        dataKey="ID"
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                        totalRecords={totalRecords}
                        onPage={onPage}
                        loading={loading}
                        header={header}
                        filters={lazyState.filters}
                        emptyMessage="Data Kosong"
                    >
                        <Column field="No" header="NO"></Column>
                        <Column field="Rekening" header="REKENING"></Column>
                        <Column field="KeteranganRekening" header="KETERANGAN REKENING"></Column>
                        <Column field="Keterangan" header={keteranganHeader}></Column>
                        <Column field="Jumlah" header={jumlahHeader} align={'right'} body={nominalBodyTemplate}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTabel} bodyStyle={{ textAlign: 'center' }}></Column>
                    </DataTable>

                    <Toolbar className="mb-4" end={rightToolbarTemplate}></Toolbar>
                </div>
            </div>
            <MultipleRekeningCOA formField={activeFormField} setRekeningDialog={setRekeningDialog} onRowSelect={onRowSelectKode} rekeningDialog={rekeningDialog} />
        </div>
    );
}

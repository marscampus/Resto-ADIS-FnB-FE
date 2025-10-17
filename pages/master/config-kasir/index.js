/*
 * Copyright (C) Godong
 *http://www.marstech.co.id
 *Email. info@marstech.co.id
 *Telp. 0811-3636-09
 *Office        : Jl. Margatama Asri IV, Kanigoro, Kec. Kartoharjo, Kota Madiun, Jawa Timur 63118
 *Branch Office : Perum Griya Gadang Sejahtera Kav. 14 Gadang - Sukun - Kota Malang - Jawa Timur
 *
 *Godong
 *Adalah merek dagang dari PT. Marstech Global
 *
 *License Agreement
 *Software komputer atau perangkat lunak komputer ini telah diakui sebagai salah satu aset perusahaan yang bernilai.
 *Di Indonesia secara khusus,
 *software telah dianggap seperti benda-benda berwujud lainnya yang memiliki kekuatan hukum.
 *Oleh karena itu pemilik software berhak untuk memberi ijin atau tidak memberi ijin orang lain untuk menggunakan softwarenya.
 *Dalam hal ini ada aturan hukum yang berlaku di Indonesia yang secara khusus melindungi para programmer dari pembajakan software yang mereka buat,
 *yaitu diatur dalam hukum hak kekayaan intelektual (HAKI).
 *
 *********************************************************************************************************
 *Pasal 72 ayat 3 UU Hak Cipta berbunyi,
 *' Barangsiapa dengan sengaja dan tanpa hak memperbanyak penggunaan untuk kepentingan komersial '
 *' suatu program komputer dipidana dengan pidana penjara paling lama 5 (lima) tahun dan/atau '
 *' denda paling banyak Rp. 500.000.000,00 (lima ratus juta rupiah) '
 *********************************************************************************************************
 *
 *Proprietary Software
 *Adalah software berpemilik, sehingga seseorang harus meminta izin serta dilarang untuk mengedarkan,
 *menggunakan atau memodifikasi software tersebut.
 *
 *Commercial software
 *Adalah software yang dibuat dan dikembangkan oleh perusahaan dengan konsep bisnis,
 *dibutuhkan proses pembelian atau sewa untuk bisa menggunakan software tersebut.
 *Detail Licensi yang dianut di software https://en.wikipedia.org/wiki/Proprietary_software
 *EULA https://en.wikipedia.org/wiki/End-user_license_agreement
 *
 *Lisensi Perangkat Lunak https://id.wikipedia.org/wiki/Lisensi_perangkat_lunak
 *EULA https://id.wikipedia.org/wiki/EULA
 *
 * Created on Mon Aug 05 2024 - 13:36:49
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */
import { useEffect, useRef, useState } from 'react';
import { getSessionServerSide } from '../../../utilities/servertool';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import Gudang from '../../component/gudang';
import { Toolbar } from 'primereact/toolbar';
import { DataTable } from 'primereact/datatable';
import { Divider } from 'primereact/divider';
import { RadioButton } from 'primereact/radiobutton';
import { Column } from 'primereact/column';
import postData from '../../../lib/Axios';
import { convertToISODate, formatDate } from '../../../component/GeneralFunction/GeneralFunction';
import { Dropdown } from 'primereact/dropdown';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function KonfigurasiKasir() {
    const apiEndPointGet = '/api/konfigurasi/kasir';
    const apiEndPointGetData = '/api/konfigurasi/kasir/get';
    const apiEndPointUpd = '/api/konfigurasi/kasir/update';

    const toast = useRef(null);
    const [configKasir, setConfigKasir] = useState([]);
    const [configKasirTabel, setConfigKasirTabel] = useState([]);
    const [gudangDialog, setGudangDialog] = useState(false);
    const [gudangKode, setGudangKode] = useState('');
    const [gudangKet, setGudangKet] = useState('');
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [defaultOption, setDropdownValue] = useState(null);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const dropdownValues = [
        { name: 'ID', label: 'u.ID' },
        { name: 'Username', label: 'u.UserName' },
        { name: 'Gudang', label: 'g.Keterangan' }
    ];

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    const onPage = (event) => {
        setlazyState(event);
        setFirst(event.first); // Mengatur halaman saat halaman berubah
        setRows(event.rows); // Mengatur jumlah baris per halaman
    };

    const loadLazyData = async () => {
        setLoading(true);
        const vaData = await postData(apiEndPointGet, lazyState);
        const json = vaData.data;
        setConfigKasirTabel(json.data);
        setTotalRecords(json.total_data);
        setLoading(false);
    };

    const btnGudang = () => {
        setGudangDialog(true);
    };

    const handleGudangData = (gudangKode, gudangKet) => {
        setGudangKode(gudangKode);
        setGudangKet(gudangKet);
        setConfigKasir((prevConfigKasir) => ({
            ...prevConfigKasir,
            Gudang: gudangKode
        }));
    };

    const onRowSelectUsername = async (event) => {
        // Set GudangKode dan GudangKet ke nilai kosong sebelum request ulang
        setGudangKode('');
        setGudangKet('');

        const selectedID = event.data.ID;
        const selectedUsername = configKasirTabel.find((configKasir) => configKasir.ID === selectedID);

        if (selectedUsername) {
            let _configKasir = { ...configKasir };
            _configKasir.UserName = selectedUsername.UserName;

            let requestBody = {
                ID: selectedID
            };

            const vaData = await postData(apiEndPointGetData, requestBody);
            const json = vaData.data;

            _configKasir.FullName = json.FullName;
            setGudangKode(json.Gudang);
            setGudangKet(json.NamaGudang);
            _configKasir.Status = json.Aktif;
            setConfigKasir(_configKasir);
        }
    };

    const onInputChange = (e, fieldName) => {
        const value = e.target.value;
        setConfigKasir((prevConfigKasir) => ({
            ...prevConfigKasir,
            [fieldName]: value
        }));
    };

    const saveKonfigurasi = async (e) => {
        e.preventDefault();
        const requestBody = {
            UserName: configKasir.UserName,
            FullName: configKasir.FullName,
            Gudang: gudangKode,
            Status: configKasir.Status
        };

        try {
            setLoading(true);
            const vaTable = await postData(apiEndPointUpd, requestBody);
            const json = vaTable.data;
            if (json.status == 'error') {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Kesalahan Proses', life: 3000 });
                return;
            }
            if (json.status == 'success') {
                toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Config Berhasil Diperbarui', life: 3000 });
                loadLazyData();
            }
        } finally {
            setLoading(false);
        }
    };

    const konfigurasiFooter = (
        <>
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveKonfigurasi} />
        </>
    );

    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup"></div>
                <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="name" placeholder="Pilih Kolom" />
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => onSearch(e.target.value)} placeholder="Search..." />
                </span>
            </div>
        </div>
    );

    const onSearch = (value) => {
        let _lazyState = { ...lazyState };
        _lazyState['filters'] = {};
        if (defaultOption != null && defaultOption.label != null) {
            _lazyState['filters'][defaultOption.label] = value;
        }
        onPage(_lazyState);
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast}></Toast>
                    <h4>Konfigurasi Kasir</h4>
                    <hr></hr>
                    <div className="formgrid grid">
                        <div className="field col-12 mb-2 lg:col-6">
                            <div className="formgrid grid">
                                <div className="field col-2 mb-2 lg:col-2" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Username</label>
                                </div>
                                <div className="field col-4 mb-2 lg:col-4">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ borderRadius: '5px', marginRight: '5px' }} value={configKasir.UserName} readOnly />
                                    </div>
                                </div>
                            </div>
                            <div className="formgrid grid">
                                <div className="field col-2 mb-2 lg:col-2" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Fullname</label>
                                </div>
                                <div className="field col-4 mb-2 lg:col-4">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ borderRadius: '5px', marginRight: '5px' }} value={configKasir.FullName} readOnly />
                                    </div>
                                </div>
                            </div>
                            <div className="formgrid grid">
                                <div className="field col-2 mb-2 lg:col-2" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Gudang</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={gudangKode} readOnly />
                                        <Button icon="pi pi-search" onClick={btnGudang} className="p-button" />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={gudangKet} readOnly />
                                    </div>
                                </div>
                            </div>
                            <div className="formgrid grid">
                                <div className="field col-2 mb-2 lg:col-2" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Status</label>
                                </div>
                                <div className="field col-10 mb-2 lg:col-10">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <div className="col-4">
                                            <RadioButton inputId="aktif" name="gabungan" value="1" checked={configKasir.Status === '1'} onChange={(e) => onInputChange(e, 'Status')} style={{ marginRight: '5px' }}></RadioButton>
                                            <label>Aktif</label>
                                        </div>
                                        <div className="col-4">
                                            <RadioButton inputId="nonaktif" name="Status" value="0" checked={configKasir.Status === '0'} onChange={(e) => onInputChange(e, 'Status')} style={{ marginRight: '5px' }}></RadioButton>
                                            <label>Non-Aktif</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Divider layout="vertical" style={{ margin: '-1px' }}></Divider>
                        <div className="field col-12 mb-2 lg:col-6" style={{ overflow: 'auto' }}>
                            <DataTable
                                value={configKasirTabel}
                                // globalFilter={globalFilter}
                                filters={lazyState.filters}
                                header={headerSearch}
                                first={first} // Menggunakan nilai halaman pertama dari state
                                rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                                onPage={onPage} // Memanggil fungsi onPage saat halaman berubah
                                paginator
                                paginatorTemplate={`FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown`}
                                currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                                totalRecords={totalRecords} // Total number of records
                                size="small"
                                loading={loading}
                                emptyMessage="Data Kosong"
                                onRowSelect={onRowSelectUsername}
                                selectionMode="single"
                                onRowsPerPageChange={(e) => setRowsPerPage(e.value)}
                            >
                                <Column field="ID" header="ID"></Column>
                                <Column field="UserName" header="USERNAME"></Column>
                                <Column field="FullName" header="FULLNAME"></Column>
                                <Column field="Tgl" body={(rowData) => (rowData.Tgl ? `${formatDate(rowData.Tgl)}` : '')} header="TGL"></Column>
                                <Column field="NamaGudang" header="GUDANG"></Column>
                                <Column field="Aktif" header="STATUS" body={(rowData) => (rowData.Aktif === '1' ? 'Aktif' : 'Nonaktif')} />
                            </DataTable>
                        </div>
                    </div>
                    <Toolbar className="mb-4" right={konfigurasiFooter}></Toolbar>
                </div>
            </div>
            <Gudang gudangDialog={gudangDialog} setGudangDialog={setGudangDialog} btnGudang={btnGudang} handleGudangData={handleGudangData} />
        </div>
    );
}

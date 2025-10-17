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
 * Created on Sat Jun 15 2024 - 02:06:31
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */

import { Toast } from 'primereact/toast';
import { useEffect, useRef, useState } from 'react';
import { getSessionServerSide } from '../../../utilities/servertool';
import { TabPanel, TabView } from 'primereact/tabview';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import postData from '../../../lib/Axios';
import { ProgressBar } from 'primereact/progressbar';
import { Toolbar } from 'primereact/toolbar';
import Rekening from '../../component/rekening';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Column } from 'primereact/column';
import { ProgressSpinner } from 'primereact/progressspinner';
import MultipleRekeningCOA from '../../component/multipleRekeningCOA';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function KonfigurasiCOA() {
    const apiEndPointGetPembelian = '/api/setup/coa/get-pembelian';
    const apiEndPointGetToko = '/api/setup/coa/get-toko';
    const apiEndPointGetPiutang = '/api/setup/coa/get-piutang';
    const apiEndPointGetAdj = '/api/setup/coa/get-adj';
    const apiEndPointGetPembukuan = '/api/setup/coa/get-pembukuan';
    const apiEndPointStore = '/api/setup/coa/store';
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeIndexRekening, setActiveIndexRekening] = useState(0);

    const [pembelianLoaded, setPembelianLoaded] = useState(false);
    const [piutangLoaded, setPiutangLoaded] = useState(false);
    const [tokoLoaded, setTokoLoaded] = useState(false);
    const [adjLoaded, setAdjLoaded] = useState(false);
    const [pembukuanLoaded, setPembukuanLoaded] = useState(false);

    const [configPembelian, setConfigPembelian] = useState([]);
    const [configPiutang, setConfigPiutang] = useState([]);
    const [configToko, setConfigToko] = useState([]);
    const [configAdj, setConfigAdj] = useState([]);
    const [configPembukuan, setConfigPembukuan] = useState([]);

    const [rekeningDialog, setRekeningDialog] = useState(false);
    const [rekeningTable, setRekeningTable] = useState([]);
    const [activeFormField, setActiveFormField] = useState(null);
    const [defaultOption, setDropdownValue] = useState(null);
    const dropdownValues = [
        { name: 'KODE', label: 'KODE' },
        { name: 'KETERANGAN', label: 'KETERANGAN' }
    ];
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const [lazyStateRekening, setlazyStateRekening] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                if (!pembelianLoaded) {
                    await loadPembelian();
                    setPembelianLoaded(true);
                }
                if (!tokoLoaded) {
                    await loadToko();
                    setTokoLoaded(true);
                }
                if (!piutangLoaded) {
                    await loadPiutang();
                    setPiutangLoaded(true);
                }
                if (!adjLoaded) {
                    await loadAdj();
                    setAdjLoaded(true);
                }
                if (!pembukuanLoaded) {
                    await loadPembukuan();
                    setPembukuanLoaded(true);
                }
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, []);

    const onPage = (event) => {
        setlazyStateRekening(event);
    };

    //  Yang Handle Get Data Pembelian
    const loadPembelian = async () => {
        try {
            setLoading(true);
            const vaTable = await postData(apiEndPointGetPembelian, lazyState);
            const json = vaTable.data;
            setConfigPembelian(json);
        } finally {
            setLoading(false);
        }
    };

    //  Yang Handle Get Data Toko
    const loadToko = async () => {
        try {
            setLoading(true);
            const vaTable = await postData(apiEndPointGetToko, lazyState);
            const json = vaTable.data;
            setConfigToko(json);
        } finally {
            setLoading(false);
        }
    };

    //  Yang Handle Get Data Piutang
    const loadPiutang = async () => {
        try {
            setLoading(true);
            const vaTable = await postData(apiEndPointGetPiutang, lazyState);
            const json = vaTable.data;
            setConfigPiutang(json);
        } finally {
            setLoading(false);
        }
    };

    //  Yang Handle Get Data Adj
    const loadAdj = async () => {
        try {
            setLoading(true);
            const vaTable = await postData(apiEndPointGetAdj, lazyState);
            const json = vaTable.data;
            setConfigAdj(json);
        } finally {
            setLoading(false);
        }
    };

    //  Yang Handle Get Data Pembukua
    const loadPembukuan = async () => {
        try {
            setLoading(true);
            const vaTable = await postData(apiEndPointGetPembukuan, lazyState);
            const json = vaTable.data;
            setConfigPembukuan(json);
        } finally {
            setLoading(false);
        }
    };

    //  Yang Handle Pergantian Data
    const toggleDataTable = async (event) => {
        const selectedIndex = event.index ?? 0;
        setActiveIndex(selectedIndex);
        setLoadingItem(true);
        try {
            if (selectedIndex === 0 && !pembelianLoaded) {
                await loadPembelian();
                setPembelianLoaded(true);
            }
            if (selectedIndex === 0 && !piutangLoaded) {
                await loadPiutang();
                setPiutangLoaded(true);
            }
            if (selectedIndex === 0 && !tokoLoaded) {
                await loadToko();
                setTokoLoaded(true);
            }
            if (selectedIndex === 0 && !adjLoaded) {
                await loadToko();
                setAdjLoaded(true);
            }
            if (selectedIndex === 0 && !pembukuanLoaded) {
                await loadPembukuan();
                setPembukuanLoaded(true);
            }
        } finally {
            setLoadingItem(false);
        }
    };

    const toggleDataTableRekening = async (event) => {
        setActiveIndexRekening(event.index);
        let _lazyStateRekening = { ...lazyStateRekening };
        _lazyStateRekening['filters']['KODE'] = event.index + 1;
        setlazyStateRekening(_lazyStateRekening);
    };

    // Yang Handle Save Data
    const saveKonfigurasi = async (e) => {
        e.preventDefault();

        const combinedConfig = {
            // Pembelian
            PembelianKredit: configPembelian.PembelianKredit || '',
            PembelianTunai: configPembelian.PembelianTunai || '',
            HutangDagang: configPembelian.HutangDagang || '',
            DiscHutangDagang: configPembelian.DiscHutangDagang || '',
            PPNHutangDagang: configPembelian.PPNHutangDagang || '',
            // Piutang
            AdminPiutang: configPiutang.AdminPiutang || '',
            // Toko
            PendapatanPenjualanTunai: configToko.PendapatanPenjualanTunai || '',
            PendapatanPenjualanNonTunai: configToko.PendapatanPenjualanNonTunai || '',
            Kas: configToko.Kas || '',
            Bank: configToko.Bank || '',
            Epayment: configToko.Epayment || '',
            Point: configToko.Point || '',
            Donasi: configToko.Donasi || '',
            Disc: configToko.Disc || '',
            PPN: configToko.PPN || '',
            SelisihPenjualan: configToko.SelisihPenjualan || '',
            // Adj
            HPP: configAdj.HPP || '',
            AsetNilaiPersediaan: configAdj.AsetNilaiPersediaan || '',
            // Pembukuan
            AsetAwal: configPembukuan.AsetAwal || '',
            KewajibanAwal: configPembukuan.KewajibanAwal || '',
            ModalAwal: configPembukuan.ModalAwal || '',
            PendapatanOperasionalAwal: configPembukuan.PendapatanOperasionalAwal || '',
            PendapatanOperasionalAkhir: configPembukuan.PendapatanOperasionalAkhir || '',
            HPPAwal: configPembukuan.HPPAwal || '',
            HPPAkhir: configPembukuan.HPPAkhir || '',
            BiayaAdminUmumAwal: configPembukuan.BiayaAdminDanUmumAwal || '',
            BiayaAdminUmumAkhir: configPembukuan.BiayaAdminDanUmumAkhir || '',
            PendapatanNonOpsAwal: configPembukuan.PendapatanNonOperasionalAwal || '',
            PendapatanNonOpsAkhir: configPembukuan.PendapatanNonOperasionalAkhir || '',
            BiayaNonOpsAwal: configPembukuan.BiayaNonOperasionalAwal || '',
            BiayaNonOpsAkhir: configPembukuan.BiayaNonOperasionalAkhir || '',
            PajakAwal: configPembukuan.PajakAwal || '',
            PajakAkhir: configPembukuan.PajakAkhir || '',
            RekeningLaba: configPembukuan.RekeningLaba || '',
            RekeningLabaTahunLalu: configPembukuan.RekeningLabaTahunLalu || ''
        };

        if (typeof combinedConfig === 'undefined' || Object.keys(combinedConfig).length === 0) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Data Kosong', life: 3000 });
            return;
        }

        try {
            setLoading(true);
            const vaData = await postData(apiEndPointStore, combinedConfig);
            const json = vaData.data;
            if (json.status == 'error') {
                toast.current.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Kesalahan Proses',
                    life: 3000
                });
                return;
            }
            if (json.status == 'success') {
                toast.current.show({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Config Berhasil Diperbarui',
                    life: 3000
                });
                loadPembelian();
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

    //  Yang Handle Rekening
    const handleSearchButtonClick = (formField) => (event) => {
        setActiveFormField(formField);
        setRekeningDialog(true);
    };

    const onRowSelectKode = (event, formField) => {
        const selectedRow = event.data;
        //  Menentukan FormField yang Sesuai
        switch (formField) {
            // ----------------------------------Pembelian
            case 'pembelianKredit':
                setConfigPembelian((prevConfigPembelian) => ({
                    ...prevConfigPembelian,
                    PembelianKredit: selectedRow.kode,
                    KetPembelianKredit: selectedRow.keterangan
                }));
                break;
            case 'pembelianTunai':
                setConfigPembelian((prevConfigPembelian) => ({
                    ...prevConfigPembelian,
                    PembelianTunai: selectedRow.kode,
                    KetPembelianTunai: selectedRow.keterangan
                }));
                break;
            case 'hutangDagang':
                setConfigPembelian((prevConfigPembelian) => ({
                    ...prevConfigPembelian,
                    HutangDagang: selectedRow.kode,
                    KetHutangDagang: selectedRow.keterangan
                }));
                break;
            case 'discHutangDagang':
                setConfigPembelian((prevConfigPembelian) => ({
                    ...prevConfigPembelian,
                    DiscHutangDagang: selectedRow.kode,
                    KetDiscHutangDagang: selectedRow.keterangan
                }));
                break;
            case 'ppnHutangDagang':
                setConfigPembelian((prevConfigPembelian) => ({
                    ...prevConfigPembelian,
                    PPNHutangDagang: selectedRow.kode,
                    KetPPNHutangDagang: selectedRow.keterangan
                }));
                break;
            // ------------------------------Piutang
            case 'adminPiutang':
                setConfigPiutang((prevConfigPiutang) => ({
                    ...prevConfigPiutang,
                    AdminPiutang: selectedRow.kode,
                    KetAdminPiutang: selectedRow.keterangan
                }));
                break;
            // ----------------------------------Toko
            case 'pendapatanPenjualanTunai':
                setConfigToko((prevConfigToko) => ({
                    ...prevConfigToko,
                    PendapatanPenjualanTunai: selectedRow.kode,
                    KetPendapatanPenjualanTunai: selectedRow.keterangan
                }));
                break;
            case 'pendapatanPenjualanNonTunai':
                setConfigToko((prevConfigToko) => ({
                    ...prevConfigToko,
                    PendapatanPenjualanNonTunai: selectedRow.kode,
                    KetPendapatanPenjualanNonTunai: selectedRow.keterangan
                }));
                break;
            case 'kas':
                setConfigToko((prevConfigToko) => ({
                    ...prevConfigToko,
                    Kas: selectedRow.kode,
                    KetKas: selectedRow.keterangan
                }));
                break;
            case 'bank':
                setConfigToko((prevConfigToko) => ({
                    ...prevConfigToko,
                    Bank: selectedRow.kode,
                    KetBank: selectedRow.keterangan
                }));
                break;
            case 'epayment':
                setConfigToko((prevConfigToko) => ({
                    ...prevConfigToko,
                    Epayment: selectedRow.kode,
                    KetEpayment: selectedRow.keterangan
                }));
                break;
            case 'point':
                setConfigToko((prevConfigToko) => ({
                    ...prevConfigToko,
                    Point: selectedRow.kode,
                    KetPoint: selectedRow.keterangan
                }));
                break;
            case 'donasi':
                setConfigToko((prevConfigToko) => ({
                    ...prevConfigToko,
                    Donasi: selectedRow.kode,
                    KetDonasi: selectedRow.keterangan
                }));
                break;
            case 'disc':
                setConfigToko((prevConfigToko) => ({
                    ...prevConfigToko,
                    Disc: selectedRow.kode,
                    KetDisc: selectedRow.keterangan
                }));
                break;
            case 'ppn':
                setConfigToko((prevConfigToko) => ({
                    ...prevConfigToko,
                    PPN: selectedRow.kode,
                    KetPPN: selectedRow.keterangan
                }));
                break;
            case 'selisihPenjualan':
                setConfigToko((prevConfigToko) => ({
                    ...prevConfigToko,
                    SelisihPenjualan: selectedRow.kode,
                    KetSelisihPenjualan: selectedRow.keterangan
                }));
                break;
            //------------------------------------Adjustment
            case 'hpp':
                setConfigAdj((prevConfigAdj) => ({
                    ...prevConfigAdj,
                    HPP: selectedRow.kode,
                    KetHPP: selectedRow.keterangan
                }));
                break;
            case 'asetNilaiPersediaan':
                setConfigAdj((prevConfigAdj) => ({
                    ...prevConfigAdj,
                    AsetNilaiPersediaan: selectedRow.kode,
                    KetAsetNilaiPersediaan: selectedRow.keterangan
                }));
                break;
            // ----------------------------------Pembukuan
            case 'aset':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    AsetAwal: selectedRow.kode,
                    KetAsetAwal: selectedRow.keterangan
                }));
                break;
            case 'kewajiban':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    KewajibanAwal: selectedRow.kode,
                    KetKewajibanAwal: selectedRow.keterangan
                }));
                break;
            case 'modal':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    ModalAwal: selectedRow.kode,
                    KetModalAwal: selectedRow.keterangan
                }));
                break;
            case 'pendapatanOperasionalAwal':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    PendapatanOperasionalAwal: selectedRow.kode,
                    KetPendapatanOperasionalAwal: selectedRow.keterangan
                }));
                break;
            case 'pendapatanOperasionalAkhir':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    PendapatanOperasionalAkhir: selectedRow.kode,
                    KetPendapatanOperasionalAkhir: selectedRow.keterangan
                }));
                break;
            case 'hppAwal':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    HPPAwal: selectedRow.kode,
                    KetHPPAwal: selectedRow.keterangan
                }));
                break;
            case 'hppAkhir':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    HPPAkhir: selectedRow.kode,
                    KetHPPAkhir: selectedRow.keterangan
                }));
                break;
            case 'biayaAdminDanUmumAwal':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    BiayaAdminDanUmumAwal: selectedRow.kode,
                    KetBiayaAdminDanUmumAwal: selectedRow.keterangan
                }));
                break;
            case 'biayaAdminDanUmumAkhir':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    BiayaAdminDanUmumAkhir: selectedRow.kode,
                    KetBiayaAdminDanUmumAkhir: selectedRow.keterangan
                }));
                break;
            case 'pendapatanNonOperasionalAwal':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    PendapatanNonOperasionalAwal: selectedRow.kode,
                    KetPendapatanNonOperasionalAwal: selectedRow.keterangan
                }));
                break;
            case 'pendapatanNonOperasionalAkhir':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    PendapatanNonOperasionalAkhir: selectedRow.kode,
                    KetPendapatanNonOperasionalAkhir: selectedRow.keterangan
                }));
                break;
            case 'biayaNonOperasionalAwal':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    BiayaNonOperasionalAwal: selectedRow.kode,
                    KetBiayaNonOperasionalAwal: selectedRow.keterangan
                }));
                break;
            case 'biayaNonOperasionalAkhir':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    BiayaNonOperasionalAkhir: selectedRow.kode,
                    KetBiayaNonOperasionalAkhir: selectedRow.keterangan
                }));
                break;
            case 'pajakAwal':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    PajakAwal: selectedRow.kode,
                    KetPajakAwal: selectedRow.keterangan
                }));
                break;
            case 'pajakAkhir':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    PajakAkhir: selectedRow.kode,
                    KetPajakAkhir: selectedRow.keterangan
                }));
                break;
            case 'biayaNonOperasionalAkhir':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    PajakAkhir: selectedRow.kode,
                    KetPajakAkhir: selectedRow.keterangan
                }));
                break;
            case 'rekeningLaba':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    RekeningLaba: selectedRow.kode,
                    KetRekeningLaba: selectedRow.keterangan
                }));
                break;
            case 'rekeningLabaTahunLalu':
                setConfigPembukuan((prevConfigPembukuan) => ({
                    ...prevConfigPembukuan,
                    RekeningLabaTahunLalu: selectedRow.kode,
                    KetRekeningLabaTahunLalu: selectedRow.keterangan
                }));
                break;
            default:
                break;
        }
        // } else {
        //     toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Rekening Induk tidak bisa dipilih', life: 3000 });
        //     return;
        // }
        setRekeningDialog(false);
    };

    const MyDataTable = ({ formField, onRowSelect }) => {
        return (
            <TabView activeIndex={activeIndexRekening} onTabChange={toggleDataTableRekening}>
                <TabPanel header="ASET">
                    {loading && (
                        <div className="p-fluid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                        </div>
                    )}
                    {!loading && (
                        <DataTable
                            value={filterDataByType(1)}
                            filters={lazyState.filters}
                            onRowSelect={(event) => onRowSelect(event, formField)}
                            selectionMode="single"
                            onPage={onPage}
                            loading={loading}
                            header={headerRekening}
                            className="datatable-responsive"
                            size="small"
                        >
                            <Column field="KODE" header="KODE" />
                            <Column field="KETERANGAN" header="KETERANGAN" />
                            <Column field="JENISREKENING" header="JENIS REKENING" body={bodyJenisRekening} />
                        </DataTable>
                    )}
                </TabPanel>
                <TabPanel header="KEWAJIBAN">
                    {loading && (
                        <div className="p-fluid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                        </div>
                    )}
                    {!loading && (
                        <DataTable
                            value={filterDataByType(2)}
                            filters={lazyState.filters}
                            onRowSelect={(event) => onRowSelect(event, formField)}
                            selectionMode="single"
                            onPage={onPage}
                            loading={loading}
                            header={headerRekening}
                            className="datatable-responsive"
                            size="small"
                        >
                            <Column field="KODE" header="KODE" />
                            <Column field="KETERANGAN" header="KETERANGAN" />
                            <Column field="JENISREKENING" header="JENIS REKENING" body={bodyJenisRekening} />
                        </DataTable>
                    )}
                </TabPanel>
                <TabPanel header="MODAL">
                    {loading && (
                        <div className="p-fluid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                        </div>
                    )}
                    {!loading && (
                        <DataTable
                            value={filterDataByType(3)}
                            filters={lazyState.filters}
                            onRowSelect={(event) => onRowSelect(event, formField)}
                            selectionMode="single"
                            onPage={onPage}
                            loading={loading}
                            header={headerRekening}
                            className="datatable-responsive"
                            size="small"
                        >
                            <Column field="KODE" header="KODE" />
                            <Column field="KETERANGAN" header="KETERANGAN" />
                            <Column field="JENISREKENING" header="JENIS REKENING" body={bodyJenisRekening} />
                        </DataTable>
                    )}
                </TabPanel>
                <TabPanel header="PENDAPATAN">
                    {loading && (
                        <div className="p-fluid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                        </div>
                    )}
                    {!loading && (
                        <DataTable
                            value={filterDataByType(4)}
                            filters={lazyState.filters}
                            onRowSelect={(event) => onRowSelect(event, formField)}
                            selectionMode="single"
                            onPage={onPage}
                            loading={loading}
                            header={headerRekening}
                            className="datatable-responsive"
                            size="small"
                        >
                            <Column field="KODE" header="KODE" />
                            <Column field="KETERANGAN" header="KETERANGAN" />
                            <Column field="JENISREKENING" header="JENIS REKENING" body={bodyJenisRekening} />
                        </DataTable>
                    )}
                </TabPanel>
                {/* <TabPanel header="HPP">
                    {loading && (
                        <div className="p-fluid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                        </div>
                    )}
                    {!loading && (
                        <DataTable
                            value={filterDataByType(5)}
                            filters={lazyState.filters}
                            onRowSelect={(event) => onRowSelect(event, formField)}
                            selectionMode="single"
                            onPage={onPage}
                            loading={loading}
                            header={headerRekening}
                            className="datatable-responsive"
                            size="small"
                        >
                            <Column field="KODE" header="KODE" />
                            <Column field="KETERANGAN" header="KETERANGAN" />
                            <Column field="JENISREKENING" header="JENIS REKENING" body={bodyJenisRekening} />
                        </DataTable>
                    )}
                </TabPanel> */}
                <TabPanel header="BIAYA">
                    {loading && (
                        <div className="p-fluid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                        </div>
                    )}
                    {!loading && (
                        <DataTable
                            value={filterDataByType(5)}
                            filters={lazyState.filters}
                            onRowSelect={(event) => onRowSelect(event, formField)}
                            selectionMode="single"
                            onPage={onPage}
                            loading={loading}
                            header={headerRekening}
                            className="datatable-responsive"
                            size="small"
                        >
                            <Column field="KODE" header="KODE" />
                            <Column field="KETERANGAN" header="KETERANGAN" />
                            <Column field="JENISREKENING" header="JENIS REKENING" body={bodyJenisRekening} />
                        </DataTable>
                    )}
                </TabPanel>
            </TabView>
        );
    };

    const filterDataByType = (type) => {
        return rekeningTable.filter((item) => {
            // Ambil angka pertama dari KODE
            const firstDigit = parseInt(item.kode.charAt(0));
            // Cocokkan dengan jenis aset
            return firstDigit === type;
        });
    };

    const bodyJenisRekening = (rowData) => {
        return <span>{rowData.JENISREKENING == 'I' ? 'INDUK' : 'DETAIL'}</span>;
    };

    const headerRekening = (
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

    const onSearch = (value) => {
        let _lazyStateRekening = { ...lazyStateRekening };
        _lazyStateRekening['filters'] = {};
        if (defaultOption != null && defaultOption.label != null) {
            _lazyStateRekening['filters'][defaultOption.label] = value;
        }
        onPage(_lazyStateRekening);
    };

    const onInputChangePembelian = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _pembelian = { ...configPembelian };
        _pembelian[`${name}`] = val;
        setConfigPembelian(_pembelian);
    };

    const onInputChangePiutang = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _piutang = { ...configPiutang };
        _piutang[`${name}`] = val;
        setConfigPiutang(_piutang);
    };

    const onInputChangeToko = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _toko = { ...configToko };
        _toko[`${name}`] = val;
        setConfigToko(_toko);
    };

    const onInputChangeAdj = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _adj = { ...configAdj };
        _adj[`${name}`] = val;
        setConfigAdj(_adj);
    };

    const onInputChangePembukuan = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _pembukuan = { ...configPembukuan };
        _pembukuan[`${name}`] = val;
        setConfigPembukuan(_pembukuan);
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>Konfigurasi COA</h4>
                    <hr></hr>
                    <Toast ref={toast}></Toast>
                    {loading && <ProgressBar maode="inderminate" style={{ height: '6px' }}></ProgressBar>}
                    <TabView activeIndex={activeIndex} onTabChange={toggleDataTable}>
                        {/* PEMBELIAN */}
                        <TabPanel header="Pembelian" style={{ width: '100%' }}>
                            {/* Pembelian Kredit */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Pembelian Kredit</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembelian.PembelianKredit} onChange={(e) => onInputChangePembelian(e, 'PembelianKredit')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('pembelianKredit')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembelian.KetPembelianKredit} readOnly />
                                    </div>
                                </div>
                            </div>
                            {/* Pembelian Tunai */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Pembelian Tunai</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembelian.PembelianTunai} onChange={(e) => onInputChangePembelian(e, 'PembelianTunai')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('pembelianTunai')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembelian.KetPembelianTunai} readOnly />
                                    </div>
                                </div>
                            </div>
                            {/* Hutang Dagang */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Hutang Dagang</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembelian.HutangDagang} onChange={(e) => onInputChangePembelian(e, 'HutangDagang')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('hutangDagang')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembelian.KetHutangDagang} readOnly />
                                    </div>
                                </div>
                            </div>
                            {/* Disc Hutang Dagang */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Disc Hutang Dagang</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembelian.DiscHutangDagang} onChange={(e) => onInputChangePembelian(e, 'DiscHutangDagang')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('discHutangDagang')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembelian.KetDiscHutangDagang} readOnly />
                                    </div>
                                </div>
                            </div>
                            {/* PPN Hutang Dagang */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>PPN Hutang Dagang</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembelian.PPNHutangDagang} onChange={(e) => onInputChangePembelian(e, 'PPNHutangDagang')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('ppnHutangDagang')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembelian.KetPPNHutangDagang} readOnly />
                                    </div>
                                </div>
                            </div>
                        </TabPanel>
                        {/* PIUTANG */}
                        <TabPanel header="Piutang" style={{ width: '100%' }}>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Admin Piutang</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPiutang.AdminPiutang} onChange={(e) => onInputChangePiutang(e, 'AdminPiutang')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('adminPiutang')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPiutang.KetAdminPiutang} readOnly />
                                    </div>
                                </div>
                            </div>
                        </TabPanel>
                        {/* TOKO */}
                        <TabPanel header="Toko" style={{ width: '100%' }}>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Pendapatan Penjualan Tunai</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configToko.PendapatanPenjualanTunai} onChange={(e) => onInputChangeToko(e, 'PendapatanPenjualanTunai')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('pendapatanPenjualanTunai')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configToko.KetPendapatanPenjualanTunai} readOnly />
                                    </div>
                                </div>
                            </div>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Pendapatan Penjualan Non Tunai</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configToko.PendapatanPenjualanNonTunai} onChange={(e) => onInputChangeToko(e, 'PendapatanPenjualanNonTunai')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('pendapatanPenjualanNonTunai')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configToko.KetPendapatanPenjualanNonTunai} readOnly />
                                    </div>
                                </div>
                            </div>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Kas</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configToko.Kas} onChange={(e) => onInputChangeToko(e, 'Kas')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('kas')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configToko.KetKas} readOnly />
                                    </div>
                                </div>
                            </div>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Bank</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configToko.Bank} onChange={(e) => onInputChangeToko(e, 'Bank')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('bank')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configToko.KetBank} readOnly />
                                    </div>
                                </div>
                            </div>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>E-Payment</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configToko.Epayment} onChange={(e) => onInputChangeToko(e, 'Epayment')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('epayment')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configToko.KetEpayment} readOnly />
                                    </div>
                                </div>
                            </div>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Point</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configToko.Point} onChange={(e) => onInputChangeToko(e, 'Point')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('point')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configToko.KetPoint} readOnly />
                                    </div>
                                </div>
                            </div>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Donasi</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configToko.Donasi} onChange={(e) => onInputChangeToko(e, 'Donasi')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('donasi')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configToko.KetDonasi} readOnly />
                                    </div>
                                </div>
                            </div>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Discount</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configToko.Disc} onChange={(e) => onInputChangeToko(e, 'Discount')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('disc')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configToko.KetDisc} readOnly />
                                    </div>
                                </div>
                            </div>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>PPN</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configToko.PPN} onChange={(e) => onInputChangeToko(e, 'PPN')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('ppn')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configToko.KetPPN} readOnly />
                                    </div>
                                </div>
                            </div>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Selisih Penjualan</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configToko.SelisihPenjualan} onChange={(e) => onInputChangeToko(e, 'SelisihPenjualan')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('selisihPenjualan')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configToko.KetSelisihPenjualan} readOnly />
                                    </div>
                                </div>
                            </div>
                        </TabPanel>
                        {/* ADJUSTMENT */}
                        <TabPanel header="Adjustment" style={{ width: '100%' }}>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>HPP</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configAdj.HPP} onChange={(e) => onInputChangeAdj(e, 'HPP')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('hpp')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configAdj.KetHPP} readOnly />
                                    </div>
                                </div>
                            </div>
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Aset Nilai Persediaan</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configAdj.AsetNilaiPersediaan} onChange={(e) => onInputChangeAdj(e, 'AsetNilaiPersediaan')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('asetNilaiPersediaan')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configAdj.KetAsetNilaiPersediaan} readOnly />
                                    </div>
                                </div>
                            </div>
                        </TabPanel>
                        {/* PEMBUKUAN */}
                        <TabPanel header="Pembukuan" style={{ width: '100%' }}>
                            {/* Aset */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Aset</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.AsetAwal} onChange={(e) => onInputChangePembukuan(e, 'AsetAwal')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('aset')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.KetAsetAwal} readOnly />
                                    </div>
                                </div>
                            </div>
                            {/* Kewajiban */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Kewajiban</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.KewajibanAwal} onChange={(e) => onInputChangePembukuan(e, 'KewajibanAwal')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('kewajiban')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.KetKewajibanAwal} readOnly />
                                    </div>
                                </div>
                            </div>
                            {/* Modal */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Modal</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.ModalAwal} onChange={(e) => onInputChangePembukuan(e, 'ModalAwal')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('modal')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.KetModalAwal} readOnly />
                                    </div>
                                </div>
                            </div>
                            {/* Pendapatan Operasional */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Pendapatan Operasional</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '3px' }}>:</label>
                                        <div className="field col-6 mb-2 lg:col-6" style={{ display: 'flex', alignItems: 'center' }}>
                                            <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.PendapatanOperasionalAwal} onChange={(e) => onInputChangePembukuan(e, 'PendapatanOperasionalAwal')} />
                                            <Button
                                                icon="pi pi-search"
                                                onClick={handleSearchButtonClick('pendapatanOperasionalAwal')}
                                                className="p-button"
                                                style={{
                                                    marginLeft: '5px',
                                                    marginRight: '5px',
                                                    borderRadius: '5px'
                                                }}
                                            />
                                            <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.KetPendapatanOperasionalAwal} readOnly />
                                        </div>
                                        <label>s.d</label>
                                        <div className="field col-6 mb-2 lg:col-6" style={{ display: 'flex', alignItems: 'center' }}>
                                            <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.PendapatanOperasionalAkhir} onChange={(e) => onInputChangePembukuan(e, 'PendapatanOperasionalAkhir')} />
                                            <Button
                                                icon="pi pi-search"
                                                onClick={handleSearchButtonClick('pendapatanOperasionalAkhir')}
                                                className="p-button"
                                                style={{
                                                    marginLeft: '5px',
                                                    marginRight: '5px',
                                                    borderRadius: '5px'
                                                }}
                                            />
                                            <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.KetPendapatanOperasionalAkhir} readOnly />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Harga Pokok Penjualan */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Harga Pokok Penjualan</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '3px' }}>:</label>
                                        <div className="field col-6 mb-2 lg:col-6" style={{ display: 'flex', alignItems: 'center' }}>
                                            <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.HPPAwal} onChange={(e) => onInputChangePembukuan(e, 'HPPAwal')} />
                                            <Button
                                                icon="pi pi-search"
                                                onClick={handleSearchButtonClick('hppAwal')}
                                                className="p-button"
                                                style={{
                                                    marginLeft: '5px',
                                                    marginRight: '5px',
                                                    borderRadius: '5px'
                                                }}
                                            />
                                            <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.KetHPPAwal} readOnly />
                                        </div>
                                        <label>s.d</label>
                                        <div className="field col-6 mb-2 lg:col-6" style={{ display: 'flex', alignItems: 'center' }}>
                                            <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.HPPAkhir} onChange={(e) => onInputChangePembukuan(e, 'HPPAkhir')} />
                                            <Button
                                                icon="pi pi-search"
                                                onClick={handleSearchButtonClick('hppAkhir')}
                                                className="p-button"
                                                style={{
                                                    marginLeft: '5px',
                                                    marginRight: '5px',
                                                    borderRadius: '5px'
                                                }}
                                            />
                                            <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.KetHPPAkhir} readOnly />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Biaya Admin dan Umum */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Biaya Admin dan Umum</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '3px' }}>:</label>
                                        <div className="field col-6 mb-2 lg:col-6" style={{ display: 'flex', alignItems: 'center' }}>
                                            <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.BiayaAdminDanUmumAwal} onChange={(e) => onInputChangePembukuan(e, 'BiayaAdminDanUmumAwal')} />
                                            <Button
                                                icon="pi pi-search"
                                                onClick={handleSearchButtonClick('biayaAdminDanUmumAwal')}
                                                className="p-button"
                                                style={{
                                                    marginLeft: '5px',
                                                    marginRight: '5px',
                                                    borderRadius: '5px'
                                                }}
                                            />
                                            <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.KetBiayaAdminDanUmumAwal} readOnly />
                                        </div>
                                        <label>s.d</label>
                                        <div className="field col-6 mb-2 lg:col-6" style={{ display: 'flex', alignItems: 'center' }}>
                                            <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.BiayaAdminDanUmumAkhir} onChange={(e) => onInputChangePembukuan(e, 'BiayaAdminDanUmumAkhir')} />
                                            <Button
                                                icon="pi pi-search"
                                                onClick={handleSearchButtonClick('biayaAdminDanUmumAkhir')}
                                                className="p-button"
                                                style={{
                                                    marginLeft: '5px',
                                                    marginRight: '5px',
                                                    borderRadius: '5px'
                                                }}
                                            />
                                            <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.KetBiayaAdminDanUmumAkhir} readOnly />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Pendapatan Non Operasional */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Pendapatan Non Operasional</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '3px' }}>:</label>
                                        <div className="field col-6 mb-2 lg:col-6" style={{ display: 'flex', alignItems: 'center' }}>
                                            <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.PendapatanNonOperasionalAwal} onChange={(e) => onInputChangePembukuan(e, 'PendapatanNonOperasionalAwal')} />
                                            <Button
                                                icon="pi pi-search"
                                                onClick={handleSearchButtonClick('pendapatanNonOperasionalAwal')}
                                                className="p-button"
                                                style={{
                                                    marginLeft: '5px',
                                                    marginRight: '5px',
                                                    borderRadius: '5px'
                                                }}
                                            />
                                            <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.KetPendapatanNonOperasionalAwal} readOnly />
                                        </div>
                                        <label>s.d</label>
                                        <div className="field col-6 mb-2 lg:col-6" style={{ display: 'flex', alignItems: 'center' }}>
                                            <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.PendapatanNonOperasionalAkhir} onChange={(e) => onInputChangePembukuan(e, 'PendapatanNonOperasionalAkhir')} />
                                            <Button
                                                icon="pi pi-search"
                                                onClick={handleSearchButtonClick('pendapatanNonOperasionalAkhir')}
                                                className="p-button"
                                                style={{
                                                    marginLeft: '5px',
                                                    marginRight: '5px',
                                                    borderRadius: '5px'
                                                }}
                                            />
                                            <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.KetPendapatanNonOperasionalAkhir} readOnly />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Biaya Non Operasional */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Biaya Non Operasional</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '3px' }}>:</label>
                                        <div className="field col-6 mb-2 lg:col-6" style={{ display: 'flex', alignItems: 'center' }}>
                                            <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.BiayaNonOperasionalAwal} onChange={(e) => onInputChangePembukuan(e, 'BiayaNonOperasionalAwal')} />
                                            <Button
                                                icon="pi pi-search"
                                                onClick={handleSearchButtonClick('biayaNonOperasionalAwal')}
                                                className="p-button"
                                                style={{
                                                    marginLeft: '5px',
                                                    marginRight: '5px',
                                                    borderRadius: '5px'
                                                }}
                                            />
                                            <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.KetBiayaNonOperasionalAwal} readOnly />
                                        </div>
                                        <label>s.d</label>
                                        <div className="field col-6 mb-2 lg:col-6" style={{ display: 'flex', alignItems: 'center' }}>
                                            <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.BiayaNonOperasionalAkhir} onChange={(e) => onInputChangePembukuan(e, 'BiayaNonOperasionalAkhir')} />
                                            <Button
                                                icon="pi pi-search"
                                                onClick={handleSearchButtonClick('biayaNonOperasionalAkhir')}
                                                className="p-button"
                                                style={{
                                                    marginLeft: '5px',
                                                    marginRight: '5px',
                                                    borderRadius: '5px'
                                                }}
                                            />
                                            <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.KetBiayaNonOperasionalAkhir} readOnly />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Pajak */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Pajak</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '3px' }}>:</label>
                                        <div className="field col-6 mb-2 lg:col-6" style={{ display: 'flex', alignItems: 'center' }}>
                                            <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.PajakAwal} onChange={(e) => onInputChangePembukuan(e, 'PajakAwal')} />
                                            <Button
                                                icon="pi pi-search"
                                                onClick={handleSearchButtonClick('pajakAwal')}
                                                className="p-button"
                                                style={{
                                                    marginLeft: '5px',
                                                    marginRight: '5px',
                                                    borderRadius: '5px'
                                                }}
                                            />
                                            <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.KetPajakAwal} readOnly />
                                        </div>
                                        <label>s.d</label>
                                        <div className="field col-6 mb-2 lg:col-6" style={{ display: 'flex', alignItems: 'center' }}>
                                            <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.PajakAkhir} onChange={(e) => onInputChangePembukuan(e, 'PajakAkhir')} />
                                            <Button
                                                icon="pi pi-search"
                                                onClick={handleSearchButtonClick('pajakAkhir')}
                                                className="p-button"
                                                style={{
                                                    marginLeft: '5px',
                                                    marginRight: '5px',
                                                    borderRadius: '5px'
                                                }}
                                            />
                                            <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.KetPajakAkhir} readOnly />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Rekening Laba */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Rekening Laba</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.RekeningLaba} onChange={(e) => onInputChangePembukuan(e, 'RekeningLaba')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rekeningLaba')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.KetRekeningLaba} readOnly />
                                    </div>
                                </div>
                            </div>
                            {/* Rekening Laba Tahun Lalu */}
                            <div className="formgrid grid">
                                <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                                    <label style={{ marginBottom: '0' }}>Rekening Laba Tahun Lalu</label>
                                </div>
                                <div className="field col-9 mb-2 lg:col-9">
                                    <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                        <InputText style={{ width: '20%', borderRadius: '5px' }} value={configPembukuan.RekeningLabaTahunLalu} onChange={(e) => onInputChangePembukuan(e, 'RekeningLabaTahunLalu')} />
                                        <Button
                                            icon="pi pi-search"
                                            onClick={handleSearchButtonClick('rekeningLabaTahunLalu')}
                                            className="p-button"
                                            style={{
                                                'margin-left': '5px',
                                                'margin-right': '5px',
                                                borderRadius: '5px'
                                            }}
                                        />
                                        <InputText style={{ width: '60%', borderRadius: '5px' }} value={configPembukuan.KetRekeningLabaTahunLalu} readOnly />
                                    </div>
                                </div>
                            </div>
                        </TabPanel>
                    </TabView>
                    <Toolbar className="mb-4" right={konfigurasiFooter}></Toolbar>
                </div>
            </div>
            <MultipleRekeningCOA formField={activeFormField} setRekeningDialog={setRekeningDialog} onRowSelect={onRowSelectKode} rekeningDialog={rekeningDialog} />
        </div>
    );
}

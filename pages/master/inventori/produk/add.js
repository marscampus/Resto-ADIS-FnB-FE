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
import CameraCapture from '../../../../component/captureCamera';
import { BreadCrumb } from 'primereact/breadcrumb';
import Link from 'next/link';
import { useRouter } from 'next/router';

const styles = {
    tabHeader: {
        //   position: 'fixed',
        //   width: '700px',
        //   zIndex: 999,
    },
    padding: {
        // paddingTop: '55px',
    }
};

export default function addProduk() {
    const breadcrumbHome = { icon: 'pi pi-home', to: '/' };
    const breadcrumbItems = [{ label: 'Master' }, { label: 'Inventori' }, { label: 'Produk', to: '/master/inventori/produk' }, { label: 'Add', to: '#' }];

    let emptyproduk = {
        KODE: null,
        KODE_TOKO: null,
        NAMA: null,
        JENIS: null,
        GOLONGAN: null,
        RAK: null,
        GUDANG: null,
        SUPPLIER: null,
        EXPIRED: null,
        BERAT: null,
        DOS: null,
        SATUAN: null,
        SATUAN2: null,
        SATUAN3: null,
        QTY: null,
        ISI: null,
        ISI2: null,
        DISCOUNT: null,
        PAJAK: null,
        MIN: null,
        MAX: null,
        HB: null,
        HB2: null,
        HB3: null,
        HJ: null,
        HJ2: null,
        HJ3: null,
        HJ_TINGKAT1: null,
        MIN_TINGKAT1: null,
        HJ_TINGKAT2: null,
        MIN_TINGKAT2: null,
        HJ_TINGKAT3: null,
        MIN_TINGKAT3: null,
        HJ_TINGKAT4: null,
        MIN_TINGKAT4: null,
        HJ_TINGKAT5: null,
        MIN_TINGKAT5: null,
        HJ_TINGKAT6: null,
        MIN_TINGKAT6: null,
        HJ_TINGKAT7: null,
        MIN_TINGKAT7: null
    };
    const toast = useRef(null);
    const [produk, setProduk] = useState(emptyproduk);
    const [produkDialog, setProdukDialog] = useState(false);
    const [produkTabel, setProdukTabel] = useState([]);
    const [golongan, setGolongan] = useState([]);
    const [golonganDialog, setGolonganDialog] = useState(false);
    const [rak, setRak] = useState([]);
    const [rakDialog, setRakDialog] = useState(false);
    const [gudang, setGudang] = useState([]);
    const [gudangDialog, setGudangDialog] = useState(false);
    const [supplier, setSupplier] = useState([]);
    const [supplierDialog, setSupplierDialog] = useState(false);
    const [kadaluarsa, setKadaluarsa] = useState(false);
    const [berat, setBerat] = useState([]);
    const [kemasan, setKemasan] = useState([]);
    const [satuan, setSatuan] = useState(null);
    const [satuanDialog, setSatuanDialog] = useState(false);
    const [satuan2, setSatuan2] = useState([]);
    const [satuan2Dialog, setSatuan2Dialog] = useState(false);
    const [satuan3, setSatuan3] = useState([]);
    const [satuan3Dialog, setSatuan3Dialog] = useState(false);
    const [namaProduk, setNamaProduk] = useState(emptyproduk);
    const [namaProdukDialog, setNamaProdukDialog] = useState(false);
    const [stokAwal, setStokAwal] = useState([]);
    const [inputStokAwal, setInputStokAwal] = useState('');
    const [isi1, setIsi1] = useState([]);
    const [isi2, setIsi2] = useState([]);
    const [priceTag, setPriceTag] = useState([]);
    const [priceTagDialog, setPriceTagDialog] = useState(false);
    const [barcodeDialog, setBarcodeDialog] = useState(false);
    const [priceTagDiscDialog, setPriceTagDiscDialog] = useState(false);
    const [member, setMember] = useState(false);
    const [keteranganGolongan, setKeteranganGolongan] = useState('');
    const [keteranganRak, setKeteranganRak] = useState('');
    const [keteranganGudang, setKeteranganGudang] = useState('');
    const [keteranganSupplier, setKeteranganSupplier] = useState('');
    const [keteranganSatuan, setKeteranganSatuan] = useState('');
    const [keteranganSatuan2, setKeteranganSatuan2] = useState('');
    const [keteranganSatuan3, setKeteranganSatuan3] = useState('');
    const [keteranganNamaProduk, setKeteranganNamaProduk] = useState('');
    const [kode, setKode] = useState('');

    const [statusAction, setStatusAction] = useState(null);
    const [deleteProdukDialog, setDeleteProdukDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedProduk, setSelectedProduk] = useState(null);
    const [golonganTabel, setGolonganTabel] = useState(null);
    const [rakTabel, setRakTabel] = useState(null);
    const [gudangTabel, setGudangTabel] = useState(null);
    const [supplierTabel, setSupplierTabel] = useState(null);
    const [satuanTabel, setSatuanTabel] = useState(null);
    const [namaProdukTabel, setNamaProdukTabel] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [detail, setDetail] = useState(null);
    const [harga, setHarga] = useState(null);
    const [hargaPromo, setHargaPromo] = useState(null);
    const [checkboxValue, setCheckboxValue] = useState([]);
    const [radioValue, setRadioValue] = useState(null);
    const [isChecked, setIsChecked] = useState(false);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const [kodeError, setkodeError] = useState('');
    const [barcodeError, setbarcodeError] = useState('');
    const [produkError, setprodukError] = useState('');
    const [jenisError, setjenisError] = useState('');
    const [golonganError, setgolonganError] = useState('');
    const [rakError, setrakError] = useState('');
    const [gudangError, setgudangError] = useState('');
    const [supplierError, setsupplierError] = useState('');
    const [expiredError, setexpiredError] = useState('');
    const [beratError, setberatError] = useState('');
    const [kemasanError, setkemasanError] = useState('');
    const [satuanError, setsatuanError] = useState('');
    const [satuan2Error, setsatuan2Error] = useState('');
    const [satuan3Error, setsatuan3Error] = useState('');
    const [stokAwalError, setstokAwalError] = useState('');
    const [isiError, setisiError] = useState('');
    const [isi2Error, setisi2Error] = useState('');
    const [discountError, setdiscountError] = useState('');
    const [pajakError, setpajakError] = useState('');
    const [minError, setminError] = useState('');
    const [maxError, setmaxError] = useState('');
    const [hbError, sethbError] = useState('');
    const [hjError, sethjError] = useState('');
    const [hb2Error, sethb2Error] = useState('');
    const [hj2Error, sethj2Error] = useState('');
    const [hb3Error, sethb3Error] = useState('');
    const [hj3Error, sethj3Error] = useState('');
    const [hjtingkatError, sethjtingkatError] = useState('');
    const [mintingkatError, setmintingkatError] = useState('');
    const [hjtingkat2Error, sethjtingkat2Error] = useState('');
    const [mintingkat2Error, setmintingkat2Error] = useState('');
    const [hjtingkat3Error, sethjtingkat3Error] = useState('');
    const [mintingkat3Error, setmintingkat3Error] = useState('');
    const [hjtingkat4Error, sethjtingkat4Error] = useState('');
    const [mintingkat4Error, setmintingkat4Error] = useState('');
    const [hjtingkat5Error, sethjtingkat5Error] = useState('');
    const [mintingkat5Error, setmintingkat5Error] = useState('');
    const [hjtingkat6Error, sethjtingkat6Error] = useState('');
    const [mintingkat6Error, setmintingkat6Error] = useState('');
    const [hjtingkat7Error, sethjtingkat7Error] = useState('');
    const [mintingkat7Error, setmintingkat7Error] = useState('');

    useEffect(() => {
        funKode();
    }, []);

    const itemsSkelatonNamaProduk = Array.from({ length: 2 }, (v, i) => i);
    const columnsNamaProduk = [{ field: 'NAMA', header: 'NAMA' }];
    const itemsSkelatonGolongan = Array.from({ length: 2 }, (v, i) => i);
    const columnsGolongan = [
        { field: 'KODE', header: 'KODE' },
        { field: 'KETERANGAN', header: 'KETERANGAN' }
    ];
    const itemsSkelatonSupplier = Array.from({ length: 2 }, (v, i) => i);
    const columnsSupplier = [
        { field: 'KODE', header: 'KODE' },
        { field: 'NAMA', header: 'NAMA' },
        { field: 'ALAMAT', header: 'ALAMAT' }
    ];
    const onRowSelect = (event) => {
        let _produk = { ...produk };
        _produk['PRODUK'] = event.data.KODE;
        setProduk(_produk);
        setProdukDialog(false);
    };
    const op = useRef(null);

    const toggleDataTable = async (event) => {
        // op.current.toggle(event);
        let indeks = null;
        let skipRequest = false;
        switch (event.index) {
            case 1:
                indeks = 2;
                detail !== null ? (skipRequest = true) : '';
                break;
            case 2:
                indeks = 3;
                satuan !== null ? (skipRequest = true) : '';
                break;
            case 3:
                indeks = 4;
                harga !== null ? (skipRequest = true) : '';
                break;
            case 4:
                indeks = 5;
                hargaPromo !== null ? (skipRequest = true) : '';
                break;
            default:
                indeks = 1;
                detail !== null ? (skipRequest = true) : '';
                break;
        }

        setProdukDialog(true);
        setActiveIndex(event.index ?? 0);
        setLoadingItem(true);
        // if(skipRequest === false){
        //     const resProduk = await dataTableProduk(indeks);
        //     updateStateProduk(indeks,resProduk);
        // }
        setLoadingItem(false);
    };
    const onPage = (event) => {
        setlazyState(event);
    };

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
    const onJenisChange = (e) => {
        let _produk = { ...produk };
        _produk['JENIS'] = e.value;
        setProduk(_produk);
    };
    const onKemasanChange = (e) => {
        let _produk = { ...produk };
        _produk['DOS'] = e.value;
        setProduk(_produk);
    };
    const onDateChange = (e) => {
        const selectedDate = e.value; // Mendapatkan nilai tanggal yang dipilih
        setProduk((prevProduk) => ({
            ...prevProduk,
            EXPIRED: selectedDate // Memperbarui nilai produk.EXPIRED dengan tanggal yang dipilih
        }));
    };

    const onCheckboxChange = (e) => {
        let selectedValue = [...checkboxValue];
        if (e.checked) {
            selectedValue.push(e.value);
            setIsChecked(true); // set ke true jika dicentang
        } else {
            selectedValue.splice(selectedValue.indexOf(e.value), 1);
            setIsChecked(false); // set ke false jika tidak dicentang
            setKadaluarsa({
                ...produk,
                EXPIRED: null
            });
        }
        setCheckboxValue(selectedValue);
    };
    const handleCheckboxChange = (event) => {
        setStokAwal(event.target.checked);
    };
    const onUpload = () => {
        toast.current.show({ severity: 'info', summary: 'Success', detail: 'File Uploaded', life: 3000 });
    };

    // Golongan --------------------------------------------------------------------------------------
    const toggleGolongan = async (event) => {
        let indeks = null;
        let skipRequest = false;

        setGolonganDialog(true);
        setActiveIndex(event.index ?? 0);
        setLoadingItem(true);
        if (skipRequest === false) {
            const resGolongan = await dataTableGolongan(indeks);
            setGolonganTabel(resGolongan.data);
            // updateStateGolongan(indeks,resGolongan);
        }
        setLoadingItem(false);
    };

    const dataTableGolongan = (KODE) => {
        return new Promise((resolve) => {
            return fetch('/api/golongan_stok', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-ACTION': 'get' },
                body: JSON.stringify({ KODE: KODE })
            })
                .then((result) => result.json())
                .then((body) => {
                    return resolve(body);
                });
            setGolonganDialog(true);
        });
    };

    const onRowSelectGolongan = (event) => {
        const selectedKode = event.data.KODE;
        const selectedGolongan = golonganTabel.find((golongan) => golongan.KODE === selectedKode);

        if (selectedGolongan) {
            let _golongan = { ...produk };
            _golongan.GOLONGAN = selectedGolongan.KODE;
            setProduk(_golongan);

            setKeteranganGolongan(selectedGolongan.KETERANGAN);
        }

        setGolonganDialog(false);
    };

    // Rak -----------------------------------------------------------------------------------------------------------
    const toggleRak = async (event) => {
        let indeks = null;
        let skipRequest = false;

        setRakDialog(true);
        setActiveIndex(event.index ?? 0);
        setLoadingItem(true);
        if (skipRequest === false) {
            const resRak = await dataTableRak(indeks);
            setRakTabel(resRak.data);
            // updateStateRak(indeks,resRak);
        }
        setLoadingItem(false);
    };

    const dataTableRak = (KODE) => {
        return new Promise((resolve) => {
            return fetch('/api/rak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-ACTION': 'get' },
                body: JSON.stringify({ KODE: KODE })
            })
                .then((result) => result.json())
                .then((body) => {
                    return resolve(body);
                });
            setRakDialog(true);
        });
    };

    const onRowSelectRak = (event) => {
        const selectedKode = event.data.KODE;
        const selectedRak = rakTabel.find((rak) => rak.KODE === selectedKode);

        if (selectedRak) {
            let _rak = { ...produk };
            _rak.RAK = selectedRak.KODE;
            setProduk(_rak);

            setKeteranganRak(selectedRak.KETERANGAN);
        }

        setRakDialog(false);
    };

    // Gudang -----------------------------------------------------------------------------------------------------------
    const toggleGudang = async (event) => {
        let indeks = null;
        let skipRequest = false;

        setGudangDialog(true);
        setActiveIndex(event.index ?? 0);
        setLoadingItem(true);
        if (skipRequest === false) {
            const resGudang = await dataTableGudang(indeks);
            setGudangTabel(resGudang.data);
            // updateStateGudang(indeks,resGudang);
        }
        setLoadingItem(false);
    };

    const dataTableGudang = (KODE) => {
        return new Promise((resolve) => {
            return fetch('/api/gudang', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-ACTION': 'get' },
                body: JSON.stringify({ KODE: KODE })
            })
                .then((result) => result.json())
                .then((body) => {
                    return resolve(body);
                });
            setGudangDialog(true);
        });
    };

    const onRowSelectGudang = (event) => {
        const selectedKode = event.data.KODE;
        const selectedGudang = gudangTabel.find((gudang) => gudang.KODE === selectedKode);

        if (selectedGudang) {
            let _gudang = { ...produk };
            _gudang.GUDANG = selectedGudang.KODE;
            setProduk(_gudang);

            setKeteranganGudang(selectedGudang.KETERANGAN);
        }

        setGudangDialog(false);
    };

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
    };

    const dataTableSupplier = (KODE) => {
        return new Promise((resolve) => {
            return fetch('/api/daftar_supplier', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-ACTION': 'get' },
                body: JSON.stringify({ KODE: KODE })
            })
                .then((result) => result.json())
                .then((body) => {
                    return resolve(body);
                });
            setSupplierDialog(true);
        });
    };

    const onRowSelectSupplier = (event) => {
        const selectedKode = event.data.KODE;
        const selectedSupplier = supplierTabel.find((supplier) => supplier.KODE === selectedKode);

        if (selectedSupplier) {
            let _supplier = { ...produk };
            _supplier.SUPPLIER = selectedSupplier.KODE;
            setProduk(_supplier);

            setKeteranganSupplier(selectedSupplier.NAMA);
        }

        setSupplierDialog(false);
    };

    // Satuan --------------------------------------------------------------------------------------
    const toggleSatuan = async (event) => {
        let indeks = null;
        let skipRequest = false;

        setSatuanDialog(true);
        setActiveIndex(event.index ?? 1);
        setLoadingItem(true);
        if (skipRequest === false) {
            const resSatuan = await dataTableSatuan(indeks);
            setSatuanTabel(resSatuan.data);
            // updateStateSatuan(indeks,resSatuan);
        }
        setLoadingItem(false);
    };

    const dataTableSatuan = (KODE) => {
        return new Promise((resolve) => {
            return fetch('/api/satuan_stok', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-ACTION': 'get' },
                body: JSON.stringify({ KODE: KODE })
            })
                .then((result) => result.json())
                .then((body) => {
                    return resolve(body);
                });
            setSatuanDialog(true);
        });
    };

    const onRowSelectSatuan = (event) => {
        const selectedKode = event.data.KODE;
        const selectedSatuan = satuanTabel.find((satuan) => satuan.KODE === selectedKode);

        if (selectedSatuan) {
            let _satuan = { ...produk };
            _satuan.SATUAN = selectedSatuan.KODE;
            setProduk(_satuan);

            setKeteranganSatuan(selectedSatuan.KETERANGAN);
        }

        setSatuanDialog(false);
    };

    // Satuan2 --------------------------------------------------------------------------------------
    const toggleSatuan2 = async (event) => {
        let indeks = null;
        let skipRequest = false;

        setSatuan2Dialog(true);
        setActiveIndex(event.index ?? 1);
        setLoadingItem(true);
        if (skipRequest === false) {
            const resSatuan2 = await dataTableSatuan(indeks);
            setSatuanTabel(resSatuan2.data);
            // updateStateSatuan(indeks,resSatuan);
        }
        setLoadingItem(false);
    };
    const onRowSelectSatuan2 = (event) => {
        const selectedKode = event.data.KODE;
        const selectedSatuan = satuanTabel.find((satuan) => satuan.KODE === selectedKode);

        if (selectedSatuan) {
            let _satuan = { ...produk };
            _satuan.SATUAN2 = selectedSatuan.KODE;
            setProduk(_satuan);

            setKeteranganSatuan2(selectedSatuan.KETERANGAN);
        }

        setSatuan2Dialog(false);
    };

    // Satuan3 --------------------------------------------------------------------------------------
    const toggleSatuan3 = async (event) => {
        let indeks = null;
        let skipRequest = false;

        setSatuan3Dialog(true);
        setActiveIndex(event.index ?? 1);
        setLoadingItem(true);
        if (skipRequest === false) {
            const resSatuan3 = await dataTableSatuan(indeks);
            setSatuanTabel(resSatuan3.data);
            // updateStateSatuan(indeks,resSatuan);
        }
        setLoadingItem(false);
    };
    const onRowSelectSatuan3 = (event) => {
        const selectedKode = event.data.KODE;
        const selectedSatuan = satuanTabel.find((satuan) => satuan.KODE === selectedKode);

        if (selectedSatuan) {
            let _satuan = { ...produk };
            _satuan.SATUAN3 = selectedSatuan.KODE;
            setProduk(_satuan);

            setKeteranganSatuan3(selectedSatuan.KETERANGAN);
        }

        setSatuan3Dialog(false);
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
    };

    const dataTableNamaProduk = (KODE) => {
        return new Promise((resolve) => {
            return fetch('/api/produk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-ACTION': 'get' },
                body: JSON.stringify({ KODE: KODE })
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
            let _namaProduk = { ...produk };
            _namaProduk.NAMA = selectedNamaProduk.NAMA;
            setProduk(_namaProduk);

            setKeteranganNamaProduk(selectedNamaProduk.KETERANGAN);
        }

        setNamaProdukDialog(false);
    };

    const funKode = async () => {
        // setStatusAction('getKode');
        setLoading(true);
        const dataKode = await fetch('/api/produk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-ACTION': 'getKode' }
            // body:JSON.stringify(lazyState)
        })
            .then((result) => result.text())
            .then((body) => {
                return body;
            });
        setKode(dataKode);
        setProduk((prevProduk) => ({
            ...prevProduk,
            KODE: dataKode
        }));
        setLoading(false);
    };

    const validateFields = () => {
        const errors = {
            KODE: !produk.KODE ? 'Kode Harus diisi.' : produk.KODE.length > 4 ? 'Kode Tidak Boleh Lebih dari 4 Karakter.' : '',
            BARCODE: !produk.BARCODE ? 'Barcode Harus diisi.' : '',
            PRODUK: !produk.PRODUK ? 'Produk Harus diisi.' : '',
            JENIS: !produk.JENIS ? 'Jenis Harus diisi.' : '',
            GOLONGAN: !produk.GOLONGAN ? 'Golongan Harus diisi.' : '',
            RAK: !produk.RAK ? 'Rak Harus diisi.' : '',
            GUDANG: !produk.GUDANG ? 'Gudang Harus diisi.' : '',
            SUPPLIER: !produk.SUPPLIER ? 'Supplier Harus diisi.' : '',
            EXPIRED: !produk.EXPIRED ? 'Tanggal Kadaluarsa Harus diisi.' : '',
            BERAT: !produk.BERAT ? 'Berat Harus diisi.' : '',
            KEMASAN: !produk.KEMASAN ? 'Kemasan Harus diisi.' : '',
            SATUAN: !produk.SATUAN ? 'Satuan Harus diisi.' : '',
            SATUAN2: !produk.SATUAN2 ? 'Satuan2 Harus diisi.' : '',
            SATUAN3: !produk.SATUAN3 ? 'Satuan3 Harus diisi.' : '',
            QTY: !produk.QTY ? 'Stok Harus diisi.' : '',
            ISI: !produk.ISI ? 'Isi Harus diisi.' : '',
            ISI2: !produk.ISI2 ? 'Isi2 Harus diisi.' : '',
            DISCOUNT: !produk.DISCOUNT ? 'Discount Harus diisi.' : '',
            PAJAK: !produk.PAJAK ? 'Pajak Harus diisi.' : '',
            MIN: !produk.MIN ? 'Minimal Stok Harus diisi.' : '',
            MAX: !produk.MAX ? 'Maximal Stok Harus diisi.' : '',
            HJ: !produk.HJ ? 'Harga Jual Harus diisi.' : '',
            HB2: !produk.HB2 ? 'Harga Beli2 Harus diisi.' : '',
            HJ2: !produk.HJ2 ? 'Harga Jual2 Harus diisi.' : '',
            HB3: !produk.HB3 ? 'Harga Beli3 Harus diisi.' : '',
            HJ3: !produk.HJ3 ? 'Harga Jual3 Harus diisi.' : '',
            HJ_TINGKAT1: !produk.HJ_TINGKAT1 ? 'Harga Jual Tingkat 1 Harus diisi.' : '',
            MIN_TINGKAT1: !produk.MIN_TINGKAT1 ? 'QTY Min Tingkat 1 Harus diisi.' : '',
            HJ_TINGKAT2: !produk.HJ_TINGKAT2 ? 'Harga Jual Tingkat 2 Harus diisi.' : '',
            MIN_TINGKAT2: !produk.MIN_TINGKAT2 ? 'QTY Min Tingkat 2 Harus diisi.' : '',
            HJ_TINGKAT3: !produk.HJ_TINGKAT3 ? 'Harga Jual Tingkat 3 Harus diisi.' : '',
            MIN_TINGKAT3: !produk.MIN_TINGKAT3 ? 'QTY Min Tingkat 3 Harus diisi.' : '',
            HJ_TINGKAT4: !produk.HJ_TINGKAT4 ? 'Harga Jual Tingkat 4 Harus diisi.' : '',
            MIN_TINGKAT4: !produk.MIN_TINGKAT4 ? 'QTY Min Tingkat 4 Harus diisi.' : '',
            HJ_TINGKAT5: !produk.HJ_TINGKAT5 ? 'Harga Jual Tingkat 5 Harus diisi.' : '',
            MIN_TINGKAT5: !produk.MIN_TINGKAT5 ? 'QTY Min Tingkat 5 Harus diisi.' : '',
            HJ_TINGKAT6: !produk.HJ_TINGKAT6 ? 'Harga Jual Tingkat 6 Harus diisi.' : '',
            MIN_TINGKAT6: !produk.MIN_TINGKAT6 ? 'QTY Min Tingkat 6 Harus diisi.' : '',
            HJ_TINGKAT7: !produk.HJ_TINGKAT7 ? 'Harga Jual Tingkat 7 Harus diisi.' : '',
            MIN_TINGKAT7: !produk.MIN_TINGKAT7 ? 'QTY Min Tingkat 7 Harus diisi.' : ''
        };

        setkodeError(errors.KODE);
        setbarcodeError(errors.BARCODE);
        setprodukError(errors.PRODUK);
        setjenisError(errors.JENIS);
        setgolonganError(errors.GOLONGAN);
        setrakError(errors.RAK);
        setgudangError(errors.GUDANG);
        setsupplierError(errors.SUPPLIER);
        setexpiredError(errors.EXPIRED);
        setberatError(errors.BERAT);
        setkemasanError(errors.KEMASAN);
        setsatuanError(errors.SATUAN);
        setsatuan2Error(errors.SATUAN2);
        setsatuan3Error(errors.SATUAN3);
        setstokAwalError(errors.QTY);
        setisiError(errors.ISI);
        setisi2Error(errors.ISI2);
        setdiscountError(errors.DISCOUNT);
        setpajakError(errors.PAJAK);
        setminError(errors.MIN);
        setmaxError(errors.MAX);
        sethbError(errors.HB);
        sethjError(errors.HJ);
        sethb2Error(errors.HB2);
        sethj2Error(errors.HJ2);
        sethb3Error(errors.HB3);
        sethj3Error(errors.HJ3);
        sethjtingkatError(errors.HJ_TINGKAT1);
        setmintingkatError(errors.MIN_TINGKAT1);
        sethjtingkat2Error(errors.HJ_TINGKAT2);
        setmintingkat2Error(errors.MIN_TINGKAT2);
        sethjtingkat3Error(errors.HJ_TINGKAT3);
        setmintingkat3Error(errors.MIN_TINGKAT3);
        sethjtingkat4Error(errors.HJ_TINGKAT4);
        setmintingkat4Error(errors.MIN_TINGKAT4);
        sethjtingkat5Error(errors.HJ_TINGKAT5);
        setmintingkat5Error(errors.MIN_TINGKAT5);
        sethjtingkat6Error(errors.HJ_TINGKAT6);
        setmintingkat6Error(errors.MIN_TINGKAT6);
        sethjtingkat7Error(errors.HJ_TINGKAT7);
        setmintingkat7Error(errors.MIN_TINGKAT7);

        return Object.values(errors).every((error) => !error);
    };

    const saveProduk = async (e) => {
        e.preventDefault();
        setSubmitted(true);
        if (!validateFields()) {
            return;
        }
        let _produkTabel = [...produkTabel];
        let _produk = { ...produk };
        let header = {};
        let detail = null;
        if (statusAction == 'update') {
            const index = findIndexById(produk.ID);
            _produkTabel[index] = _produk;
            detail = 'update data berhasil';
            header = { 'Content-Type': 'application/json', 'X-ACTION': 'update' };
        } else {
            _produkTabel.push(_produk);
            detail = 'data berhasil ditambahkan';
            header = { 'Content-Type': 'application/json', 'X-ACTION': 'store' };
        }

        const responsePost = fetch('/api/produk/', {
            method: 'POST',
            headers: header,
            body: JSON.stringify(produk)
        })
            .then((result) => result.text())
            .then((body) => {
                return body;
            });
        let resPost = await responsePost;
        let data = JSON.parse(resPost);
        if (data.status == 'success') {
            toast.current.show({ severity: 'success', summary: 'Successful', detail: detail, life: 3000 });
            if (statusAction == 'update') {
                setProdukTabel(_produkTabel);
                setProduk(emptyproduk);
            } else {
                refreshTabel();
            }
            router.push('/master/inventori/produk');
        } else {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'error', life: 3000 });
        }
    };

    const findIndexById = (ID) => {
        let index = -1;
        for (let i = 0; i < produkTabel.length; i++) {
            if (produkTabel[i].ID === ID) {
                index = i;
                break;
            }
        }
        return index;
    };

    // Hide --------------------------------------------------------------------------------------------
    const hideDialog = () => {
        resetFields();
        setSubmitted(false);
        setProdukDialog(false);
    };

    const hideDialogGolongan = () => {
        setSubmitted(false);
        setGolonganDialog(false);
    };

    const hideDialogRak = () => {
        setSubmitted(false);
        setRakDialog(false);
    };

    const hideDialogGudang = () => {
        setSubmitted(false);
        setGudangDialog(false);
    };

    const hideDialogSupplier = () => {
        setSubmitted(false);
        setSupplierDialog(false);
    };

    const hideDialogSatuan = () => {
        setSubmitted(false);
        setSatuanDialog(false);
    };

    const hideDialogSatuan2 = () => {
        setSubmitted(false);
        setSatuan2Dialog(false);
    };

    const hideDialogSatuan3 = () => {
        setSubmitted(false);
        setSatuan3Dialog(false);
    };

    const hideDialogNamaProduk = () => {
        setSubmitted(false);
        setNamaProdukDialog(false);
    };

    // ------------------------------------------------------------------------------------------------------ button
    const router = useRouter();
    const produkFooter = (
        <>
            <Button
                label="Cancel"
                icon="pi pi-times"
                className="p-button-text"
                onClick={() => {
                    router.push('/master/inventori/produk');
                }}
            />
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveProduk} />
        </>
    );

    const refreshTabel = () => {
        let getLazyState = { ...lazyState };
        setlazyState(getLazyState);
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <BreadCrumb home={breadcrumbHome} model={breadcrumbItems} style={{ background: 'none', border: 'none' }} />
                <div className="card">
                    <h4>Menu Produk</h4>
                    <hr />
                    <Toast ref={toast} />
                    <TabView activeIndex={activeIndex} onTabChange={toggleDataTable} style={styles.tabHeader}>
                        <TabPanel header="Detail Item">
                            <div style={styles.padding}>
                                <div className="formgrid grid">
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <label htmlFor="kode">Kode</label>
                                        <div className="p-inputgroup">
                                            <InputText readOnly id="kode" value={kode} onChange={(e) => onInputChange(e, 'KODE')} required className={classNames({ 'p-invalid': submitted && !produk.KODE })} />
                                        </div>
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <label htmlFor="barcode">Barcode</label>
                                        <div className="p-inputgroup">
                                            <InputText id="barcode" value={produk.KODE_TOKO} onChange={(e) => onInputChange(e, 'KODE_TOKO')} required autoFocus className={classNames({ 'p-invalid': submitted && !produk.KODE_TOKO })} />
                                        </div>
                                        {submitted && !produk.BARCODE && <small className="p-invalid">{barcodeError}</small>}
                                    </div>
                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-12 mb-2 lg:col-12">
                                        <label htmlFor="namaproduk">Nama Produk</label>
                                        <div className="p-inputgroup">
                                            <InputText id="namaProduk" value={produk.NAMA} onChange={(e) => onInputChange(e, 'NAMA')} required className={classNames({ 'p-invalid': submitted && !produk.NAMA })} />
                                            <Button icon="pi pi-search" className="p-button" onClick={toggleNamaProduk} />
                                        </div>
                                        {submitted && !produk.PRODUK && <small className="p-invalid">{produkError}</small>}
                                    </div>
                                </div>
                                <div className="field">
                                    <label className="mb-3">Jenis</label>
                                    <div className="formgrid grid">
                                        <div className="field-radiobutton col-6">
                                            <RadioButton inputId="jenis_barang" name="jenis" value="B" onChange={onJenisChange} checked={produk.JENIS === 'B'} />
                                            <label htmlFor="jenis_barang">Barang</label>
                                        </div>
                                        <div className="field-radiobutton col-6">
                                            <RadioButton inputId="jenis_jasa" name="jenis" value="J" onChange={onJenisChange} checked={produk.JENIS === 'J'} />
                                            <label htmlFor="jenis_jasa">Jasa</label>
                                        </div>
                                    </div>
                                    {submitted && !produk.JENIS && <small className="p-invalid">{jenisError}</small>}
                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-12 mb-2 lg:col-12">
                                        <label htmlFor="golongan">Kategori</label>
                                        <div className="p-inputgroup">
                                            <InputText id="golonganKode" value={produk.GOLONGAN} onChange={(e) => onInputChange(e, 'GOLONGAN')} className={classNames({ 'p-invalid': submitted && !produk.GOLONGAN })} />
                                            <Button icon="pi pi-search" className="p-button" onClick={toggleGolongan} />
                                            <InputText readOnly id="ket-golongan" value={keteranganGolongan} />
                                        </div>
                                        {submitted && !produk.GOLONGAN && <small className="p-invalid">{golonganError}</small>}
                                    </div>
                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-12 mb-2 lg:col-12">
                                        <label htmlFor="rak">Rak</label>
                                        <div className="p-inputgroup">
                                            <InputText id="rak_kode" value={produk.RAK} onChange={(e) => onInputChange(e, 'RAK')} className={classNames({ 'p-invalid': submitted && !produk.RAK })} />
                                            <Button icon="pi pi-search" className="p-button" onClick={toggleRak} />
                                            <InputText readOnly id="ket-Rak" value={keteranganRak} />
                                        </div>
                                        {submitted && !produk.RAK && <small className="p-invalid">{rakError}</small>}
                                    </div>
                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-12 mb-2 lg:col-12">
                                        <label htmlFor="gudang">Gudang</label>
                                        <div className="p-inputgroup">
                                            <InputText id="gudang_kode" value={produk.GUDANG} onChange={(e) => onInputChange(e, 'GUDANG')} className={classNames({ 'p-invalid': submitted && !produk.GUDANG })} />
                                            <Button icon="pi pi-search" className="p-button" onClick={toggleGudang} />
                                            <InputText readOnly id="ket-Gudang" value={keteranganGudang} />
                                        </div>
                                        {submitted && !produk.GUDANG && <small className="p-invalid">{gudangError}</small>}
                                    </div>
                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-12 mb-2 lg:col-12">
                                        <label htmlFor="supplier">Supplier</label>
                                        <div className="p-inputgroup">
                                            <InputText id="supplier_kode" value={produk.SUPPLIER} onChange={(e) => onInputChange(e, 'SUPPLIER')} className={classNames({ 'p-invalid': submitted && !produk.SUPPLIER })} />
                                            <Button icon="pi pi-search" className="p-button" onClick={toggleSupplier} />
                                            <InputText readOnly id="ket-Supplier" value={keteranganSupplier} />
                                        </div>
                                        {submitted && !produk.SUPPLIER && <small className="p-invalid">{supplierError}</small>}
                                    </div>
                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-8 mb-2 lg:col-6">
                                        <label htmlFor="kadaluarsa">Tanggal Kadaluarsa</label>
                                        {!produk.TIDAKEXPIRED && (
                                            <div className="p-inputgroup">
                                                <Calendar id="kadaluarsa" value={produk.EXPIRED} onChange={onDateChange} showIcon disabled={!isChecked} dateFormat="dd-mm-yy" />
                                            </div>
                                        )}
                                        {submitted && !produk.EXPIRED && <small className="p-invalid">{expiredError}</small>}
                                    </div>
                                    <div className="field col-4 mb-2 lg:col-4">
                                        <label htmlFor="kadaluarsa"></label>
                                        <div className="p-field-checkbox">
                                            <Checkbox inputId="kadaluarsa" name="kadaluarsa" value="Kadaluarsa" checked={checkboxValue.indexOf('Kadaluarsa') !== -1} onChange={onCheckboxChange} />
                                            <label htmlFor="tidakKadaluarsa"> Tidak Ada Tanggal Kadaluarsa</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-12 mb-2 lg:col-12">
                                        <label htmlFor="berat">Berat</label>
                                        <div className="p-inputgroup">
                                            <InputText
                                                id="berat"
                                                mode="decimal"
                                                minFractionDigits={2}
                                                maxFractionDigits={5}
                                                value={produk.BERAT}
                                                onChange={(e) => onInputChange(e, 'BERAT')}
                                                required
                                                className={classNames({ 'p-invalid': submitted && !produk.BERAT })}
                                            />
                                        </div>
                                        {submitted && !produk.BERAT && <small className="p-invalid">{beratError}</small>}
                                    </div>
                                </div>
                            </div>
                        </TabPanel>
                        <TabPanel header="Satuan">
                            <div style={styles.padding}>
                                <div class="grid formgrid">
                                    <div className="field col-12 mb-2 lg:col-4">
                                        <label htmlFor="kemasan">Kemasan</label>
                                        <div className="field-radiobutton">
                                            <RadioButton inputId="kemasan1" name="kemasan" value="1" onChange={onKemasanChange} checked={produk.DOS === '1'} />
                                            <label htmlFor="kemasan1">1 Kemasan</label>
                                        </div>
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-4">
                                        <div className="field-radiobutton" style={{ paddingTop: '25px' }}>
                                            <RadioButton inputId="kemasan2" name="kemasan" value="2" onChange={onKemasanChange} checked={produk.DOS === '2'} />
                                            <label htmlFor="kemasan2">2 Kemasan</label>
                                        </div>
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-4">
                                        <div className="field-radiobutton" style={{ paddingTop: '25px' }}>
                                            <RadioButton inputId="kemasan3" name="kemasan" value="3" onChange={onKemasanChange} checked={produk.DOS === '3'} />
                                            <label htmlFor="kemasan3">3 Kemasan</label>
                                        </div>
                                    </div>
                                    {submitted && !produk.KEMASAN && <small className="p-invalid">{kemasanError}</small>}
                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-12 mb-2 lg:col-12">
                                        <label htmlFor="satuan">Satuan 1</label>
                                        <div className="p-inputgroup">
                                            <InputText id="satuan" value={produk.SATUAN} onChange={(e) => onInputChange(e, 'SATUAN')} className={classNames({ 'p-invalid': submitted && !produk.SATUAN })} />
                                            <Button icon="pi pi-search" className="p-button" onClick={toggleSatuan} />
                                            <InputText readOnly id="ket-Satuan" value={keteranganSatuan} />
                                        </div>
                                        {submitted && !produk.SATUAN && <small className="p-invalid">{satuanError}</small>}
                                    </div>
                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-12 mb-2 lg:col-12">
                                        <label htmlFor="satuan2">Satuan 2</label>
                                        <div className="p-inputgroup">
                                            <InputText id="satuan2" value={produk.SATUAN2} onChange={(e) => onInputChange(e, 'SATUAN2')} className={classNames({ 'p-invalid': submitted && !produk.SATUAN2 })} />
                                            <Button icon="pi pi-search" className="p-button" onClick={toggleSatuan2} />
                                            <InputText readOnly id="ket-Satuan" value={keteranganSatuan2} />
                                        </div>
                                        {submitted && !produk.SATUAN2 && <small className="p-invalid">{satuan2Error}</small>}
                                    </div>
                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-12 mb-2 lg:col-12">
                                        <label htmlFor="satuan3">Satuan 3</label>
                                        <div className="p-inputgroup">
                                            <InputText id="satuan3" value={produk.SATUAN3} onChange={(e) => onInputChange(e, 'SATUAN3')} className={classNames({ 'p-invalid': submitted && !produk.SATUAN3 })} />
                                            <Button icon="pi pi-search" className="p-button" onClick={toggleSatuan3} />
                                            <InputText readOnly id="ket-Satuan" value={keteranganSatuan3} />
                                        </div>
                                        {submitted && !produk.SATUAN3 && <small className="p-invalid">{satuan3Error}</small>}
                                    </div>
                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-12 mb-2 lg:col-12">
                                        <label>
                                            <input type="checkbox" checked={stokAwal} onChange={handleCheckboxChange} />
                                            Stok Awal
                                        </label>
                                        {stokAwal && (
                                            <div className="field col-12 mb-2 lg:col-7">
                                                <div className="p-inputgroup">
                                                    <InputText type="number" id="stok-awal" value={produk.QTY} onChange={(e) => onInputChange(e, 'QTY')} required className={classNames({ 'p-invalid': submitted && !produk.QTY })} />
                                                </div>
                                            </div>
                                        )}
                                        {submitted && !produk.QTY && <small className="p-invalid">{stokAwalError}</small>}
                                    </div>
                                </div>
                            </div>
                        </TabPanel>
                        <TabPanel header="Harga">
                            <div style={styles.padding}>
                                <div className="formgrid grid">
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <label htmlFor="isi1">Isi 1</label>
                                        <div className="p-inputgroup">
                                            <InputText type="number" id="isi1" value={produk.ISI} onChange={(e) => onInputChange(e, 'ISI')} required autoFocus className={classNames({ 'p-invalid': submitted && !produk.ISI })} />
                                        </div>
                                        {submitted && !produk.ISI && <small className="p-invalid">{isi2Error}</small>}
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <label htmlFor="isi2">Isi 2</label>
                                        <div className="p-inputgroup">
                                            <InputText type="number" id="isi2" value={produk.ISI2} onChange={(e) => onInputChange(e, 'ISI2')} required className={classNames({ 'p-invalid': submitted && !produk.ISI2 })} />
                                        </div>
                                        {submitted && !produk.ISI2 && <small className="p-invalid">{isi2Error}</small>}
                                    </div>
                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <label htmlFor="diskon">Diskon</label>
                                        <div className="p-inputgroup">
                                            <InputText type="number" id="diskon" value={produk.DISCOUNT} onChange={(e) => onInputChange(e, 'DISCOUNT')} required className={classNames({ 'p-invalid': submitted && !produk.DISCOUNT })} />
                                            <Button icon="pi pi-percentage" className="p-button" readOnly />
                                        </div>
                                        {submitted && !produk.DISCOUNT && <small className="p-invalid">{discountError}</small>}
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <label htmlFor="isi2">Pajak</label>
                                        <div className="p-inputgroup">
                                            <InputText type="number" id="pajak" value={produk.PAJAK} onChange={(e) => onInputChange(e, 'PAJAK')} required className={classNames({ 'p-invalid': submitted && !produk.PAJAK })} />
                                            <Button icon="pi pi-percentage" className="p-button" readOnly />
                                        </div>
                                        {submitted && !produk.PAJAK && <small className="p-invalid">{pajakError}</small>}
                                    </div>
                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <label htmlFor="min-stock">Minimal Stok</label>
                                        <div className="p-inputgroup">
                                            <InputText type="number" id="min-stock" value={produk.MIN} onChange={(e) => onInputChange(e, 'MIN')} required className={classNames({ 'p-invalid': submitted && !produk.MIN })} />
                                            <span className="p-inputgroup-addon">{produk.SATUAN ? produk.SATUAN : '-'}</span>
                                        </div>
                                        {submitted && !produk.MIN && <small className="p-invalid">{minError}</small>}
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <label htmlFor="max-stok">Maximal Stok</label>
                                        <div className="p-inputgroup">
                                            <InputText type="number" id="max-stok" value={produk.MAX} onChange={(e) => onInputChange(e, 'MAX')} required className={classNames({ 'p-invalid': submitted && !produk.MAX })} />
                                            <span className="p-inputgroup-addon">{produk.SATUAN ? produk.SATUAN : '-'}</span>
                                        </div>
                                        {submitted && !produk.MAX && <small className="p-invalid">{maxError}</small>}
                                    </div>
                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-12 mb-2 lg:col-4">
                                        <label htmlFor="harga-beli1">Harga Beli 1</label>
                                        <div className="p-inputgroup">
                                            <InputNumber
                                                id="harga-beli"
                                                value={produk.HB}
                                                onChange={(e) => onInputNumberChange(e, 'HB')}
                                                mode="currency"
                                                currency="IDR"
                                                locale="id-ID"
                                                required
                                                className={classNames({ 'p-invalid': submitted && !produk.HB })}
                                            />
                                            {/* <InputText id="harga-beli1" value={produk.HB} onChange={(e) => onInputChange(e, 'HB')} required className={classNames({ 'p-invalid': submitted && !produk.HB })} /> */}
                                            <span className="p-inputgroup-addon">{produk.SATUAN ? produk.SATUAN : '-'}</span>
                                        </div>
                                        {submitted && !produk.HB && <small className="p-invalid">{hbError}</small>}
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-4">
                                        <label htmlFor="harga-beli2">Harga Beli 2</label>
                                        <div className="p-inputgroup">
                                            <InputNumber
                                                id="harga-beli2"
                                                value={produk.HB2}
                                                onChange={(e) => onInputNumberChange(e, 'HB2')}
                                                mode="currency"
                                                currency="IDR"
                                                locale="id-ID"
                                                required
                                                className={classNames({ 'p-invalid': submitted && !produk.HB2 })}
                                            />
                                            <span className="p-inputgroup-addon">{produk.SATUAN2 ? produk.SATUAN2 : '-'}</span>
                                        </div>
                                        {submitted && !produk.HB2 && <small className="p-invalid">{hb2Error}</small>}
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-4">
                                        <label htmlFor="harga-beli3">Harga Beli 3</label>
                                        <div className="p-inputgroup">
                                            <InputNumber
                                                id="harga-beli3"
                                                value={produk.HB3}
                                                mode="currency"
                                                currency="IDR"
                                                locale="id-ID"
                                                onChange={(e) => onInputNumberChange(e, 'HB3')}
                                                required
                                                className={classNames({ 'p-invalid': submitted && !produk.HB3 })}
                                            />
                                            <span className="p-inputgroup-addon">{produk.SATUAN3 ? produk.SATUAN3 : '-'}</span>
                                        </div>
                                        {submitted && !produk.HB3 && <small className="p-invalid">{hb3Error}</small>}
                                    </div>
                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-12 mb-2 lg:col-4">
                                        <label htmlFor="harga-jual1">Harga Jual 1</label>
                                        <div className="p-inputgroup">
                                            <InputNumber
                                                id="harga-jual1"
                                                value={produk.HJ}
                                                mode="currency"
                                                currency="IDR"
                                                locale="id-ID"
                                                onChange={(e) => onInputNumberChange(e, 'HJ')}
                                                required
                                                className={classNames({ 'p-invalid': submitted && !produk.HJ })}
                                            />
                                            <span className="p-inputgroup-addon">{produk.SATUAN ? produk.SATUAN : '-'}</span>
                                        </div>
                                        {submitted && !produk.HJ && <small className="p-invalid">{hjError}</small>}
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-4">
                                        <label htmlFor="harga-jual2">Harga Jual 2</label>
                                        <div className="p-inputgroup">
                                            <InputNumber
                                                id="harga-jual2"
                                                value={produk.HJ2}
                                                mode="currency"
                                                currency="IDR"
                                                locale="id-ID"
                                                onChange={(e) => onInputNumberChange(e, 'HJ2')}
                                                required
                                                className={classNames({ 'p-invalid': submitted && !produk.HJ2 })}
                                            />
                                            <span className="p-inputgroup-addon">{produk.SATUAN2 ? produk.SATUAN2 : '-'}</span>
                                        </div>
                                        {submitted && !produk.HJ2 && <small className="p-invalid">{hj2Error}</small>}
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-4">
                                        <label htmlFor="harga-jual3">Harga Jual 3</label>
                                        <div className="p-inputgroup">
                                            <InputNumber
                                                id="harga-jual3"
                                                value={produk.HJ3}
                                                mode="currency"
                                                currency="IDR"
                                                locale="id-ID"
                                                onChange={(e) => onInputNumberChange(e, 'HJ3')}
                                                required
                                                className={classNames({ 'p-invalid': submitted && !produk.HJ3 })}
                                            />
                                            <span className="p-inputgroup-addon">{produk.SATUAN3 ? produk.SATUAN3 : '-'}</span>
                                        </div>
                                        {submitted && !produk.HJ3 && <small className="p-invalid">{hj3Error}</small>}
                                    </div>
                                </div>
                            </div>
                        </TabPanel>
                        <TabPanel header="Harga Promo">
                            <div style={styles.padding}>
                                <div class="grid formgrid">
                                    <div className="field col-12 mb-2 lg:col-2">
                                        <p className="p-inputgroup-addon" style={{ marginTop: '25px' }}>
                                            Tingkat 1
                                        </p>
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <label htmlFor="harga-jual">Harga Jual</label>
                                        <div className="p-inputgroup">
                                            <InputNumber
                                                id="harga-tingkat1"
                                                value={produk.HJ_TINGKAT1}
                                                mode="currency"
                                                currency="IDR"
                                                locale="id-ID"
                                                onChange={(e) => onInputNumberChange(e, 'HJ_TINGKAT1')}
                                                required
                                                autoFocus
                                                className={classNames({ 'p-invalid': submitted && !produk.HJ_TINGKAT1 })}
                                            />
                                        </div>
                                        {submitted && !produk.HJ_TINGKAT1 && <small className="p-invalid">{hjtingkatError}</small>}
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-4">
                                        <label htmlFor="qtyMin">QTY Min</label>
                                        <div className="p-inputgroup">
                                            <InputText type="number" id="qty-min1" value={produk.MIN_TINGKAT1} onChange={(e) => onInputChange(e, 'MIN_TINGKAT1')} required className={classNames({ 'p-invalid': submitted && !produk.MIN_TINGKAT1 })} />
                                        </div>
                                        {submitted && !produk.MIN_TINGKAT1 && <small className="p-invalid">{mintingkatError}</small>}
                                    </div>
                                </div>
                                <div class="grid formgrid">
                                    <div className="field col-12 mb-2 lg:col-2">
                                        <p className="p-inputgroup-addon">Tingkat 2</p>
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <div className="p-inputgroup">
                                            <InputNumber
                                                id="harga-tingkat2"
                                                value={produk.HJ_TINGKAT2}
                                                mode="currency"
                                                currency="IDR"
                                                locale="id-ID"
                                                onChange={(e) => onInputNumberChange(e, 'HJ_TINGKAT2')}
                                                required
                                                className={classNames({ 'p-invalid': submitted && !produk.HJ_TINGKAT2 })}
                                            />
                                        </div>
                                        {submitted && !produk.HJ_TINGKAT2 && <small className="p-invalid">{hjtingkat2Error}</small>}
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-4">
                                        <div className="p-inputgroup">
                                            <InputText type="number" id="qty-min2" value={produk.MIN_TINGKAT2} onChange={(e) => onInputChange(e, 'MIN_TINGKAT2')} required className={classNames({ 'p-invalid': submitted && !produk.MIN_TINGKAT2 })} />
                                        </div>
                                        {submitted && !produk.MIN_TINGKAT2 && <small className="p-invalid">{mintingkat2Error}</small>}
                                    </div>
                                </div>
                                <div class="grid formgrid">
                                    <div className="field col-12 mb-2 lg:col-2">
                                        <p className="p-inputgroup-addon">Tingkat 3</p>
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <div className="p-inputgroup">
                                            <InputNumber
                                                id="harga-tingkat3"
                                                value={produk.HJ_TINGKAT3}
                                                mode="currency"
                                                currency="IDR"
                                                locale="id-ID"
                                                onChange={(e) => onInputNumberChange(e, 'HJ_TINGKAT3')}
                                                required
                                                className={classNames({ 'p-invalid': submitted && !produk.HJ_TINGKAT3 })}
                                            />
                                        </div>
                                        {submitted && !produk.HJ_TINGKAT3 && <small className="p-invalid">{hjtingkat3Error}</small>}
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-4">
                                        <div className="p-inputgroup">
                                            <InputText type="number" id="qty-min3" value={produk.MIN_TINGKAT3} onChange={(e) => onInputChange(e, 'MIN_TINGKAT3')} required className={classNames({ 'p-invalid': submitted && !produk.MIN_TINGKAT3 })} />
                                        </div>
                                        {submitted && !produk.MIN_TINGKAT3 && <small className="p-invalid">{mintingkat3Error}</small>}
                                    </div>
                                </div>
                                <div class="grid formgrid">
                                    <div className="field col-12 mb-2 lg:col-2">
                                        <p className="p-inputgroup-addon">Tingkat 4</p>
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <div className="p-inputgroup">
                                            <InputNumber
                                                id="harga-tingkat4"
                                                value={produk.HJ_TINGKAT4}
                                                mode="currency"
                                                currency="IDR"
                                                locale="id-ID"
                                                onChange={(e) => onInputNumberChange(e, 'HJ_TINGKAT4')}
                                                required
                                                className={classNames({ 'p-invalid': submitted && !produk.HJ_TINGKAT4 })}
                                            />
                                        </div>
                                        {submitted && !produk.HJ_TINGKAT4 && <small className="p-invalid">{hjtingkat4Error}</small>}
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-4">
                                        <div className="p-inputgroup">
                                            <InputText type="number" id="qty-min4" value={produk.MIN_TINGKAT4} onChange={(e) => onInputChange(e, 'MIN_TINGKAT4')} required className={classNames({ 'p-invalid': submitted && !produk.MIN_TINGKAT4 })} />
                                        </div>
                                        {submitted && !produk.MIN_TINGKAT4 && <small className="p-invalid">{mintingkat4Error}</small>}
                                    </div>
                                </div>
                                <div class="grid formgrid">
                                    <div className="field col-12 mb-2 lg:col-2">
                                        <p className="p-inputgroup-addon">Tingkat 5</p>
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <div className="p-inputgroup">
                                            <InputNumber
                                                id="harga-tingkat5"
                                                value={produk.HJ_TINGKAT5}
                                                mode="currency"
                                                currency="IDR"
                                                locale="id-ID"
                                                onChange={(e) => onInputNumberChange(e, 'HJ_TINGKAT5')}
                                                required
                                                className={classNames({ 'p-invalid': submitted && !produk.HJ_TINGKAT5 })}
                                            />
                                        </div>
                                        {submitted && !produk.HJ_TINGKAT5 && <small className="p-invalid">{hjtingkat5Error}</small>}
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-4">
                                        <div className="p-inputgroup">
                                            <InputText type="number" id="qty-min5" value={produk.MIN_TINGKAT5} onChange={(e) => onInputChange(e, 'MIN_TINGKAT5')} required className={classNames({ 'p-invalid': submitted && !produk.MIN_TINGKAT5 })} />
                                        </div>
                                        {submitted && !produk.MIN_TINGKAT5 && <small className="p-invalid">{mintingkat5Error}</small>}
                                    </div>
                                </div>
                                <div class="grid formgrid">
                                    <div className="field col-12 mb-2 lg:col-2">
                                        <p className="p-inputgroup-addon">Tingkat 6</p>
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <div className="p-inputgroup">
                                            <InputNumber
                                                id="harga-tingkat6"
                                                value={produk.HJ_TINGKAT6}
                                                mode="currency"
                                                currency="IDR"
                                                locale="id-ID"
                                                onChange={(e) => onInputNumberChange(e, 'HJ_TINGKAT6')}
                                                required
                                                className={classNames({ 'p-invalid': submitted && !produk.HJ_TINGKAT6 })}
                                            />
                                        </div>
                                        {submitted && !produk.HJ_TINGKAT6 && <small className="p-invalid">{hjtingkat6Error}</small>}
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-4">
                                        <div className="p-inputgroup">
                                            <InputText type="number" id="qty-min6" value={produk.MIN_TINGKAT6} onChange={(e) => onInputChange(e, 'MIN_TINGKAT6')} required className={classNames({ 'p-invalid': submitted && !produk.MIN_TINGKAT6 })} />
                                        </div>
                                        {submitted && !produk.MIN_TINGKAT6 && <small className="p-invalid">{mintingkat6Error}</small>}
                                    </div>
                                </div>
                                <div class="grid formgrid">
                                    <div className="field col-12 mb-2 lg:col-2">
                                        <p className="p-inputgroup-addon">Tingkat 7</p>
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <div className="p-inputgroup">
                                            <InputNumber
                                                id="harga-tingkat7"
                                                value={produk.HJ_TINGKAT7}
                                                mode="currency"
                                                currency="IDR"
                                                locale="id-ID"
                                                onChange={(e) => onInputNumberChange(e, 'HJ_TINGKAT7')}
                                                required
                                                className={classNames({ 'p-invalid': submitted && !produk.HJ_TINGKAT7 })}
                                            />
                                        </div>
                                        {submitted && !produk.HJ_TINGKAT7 && <small className="p-invalid">{hjtingkat7Error}</small>}
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-4">
                                        <div className="p-inputgroup">
                                            <InputText type="number" id="qty-min7" value={produk.MIN_TINGKAT7} onChange={(e) => onInputChange(e, 'MIN_TINGKAT7')} required className={classNames({ 'p-invalid': submitted && !produk.MIN_TINGKAT7 })} />
                                        </div>
                                        {submitted && !produk.MIN_TINGKAT7 && <small className="p-invalid">{mintingkat7Error}</small>}
                                    </div>
                                </div>
                            </div>
                        </TabPanel>
                        <TabPanel header="Upload Image">
                            <div style={styles.padding}>
                                <div class="grid formgrid">
                                    {/* <div className="field col-12 mb-2 lg:col-6"> */}
                                    <label htmlFor="">Upload Gambar :</label>
                                    <FileUpload style={{ marginLeft: '20px' }} mode="basic" name="demo[]" url="/api/upload" accept="image/*" maxFileSize={1000000} onUpload={onUpload} />
                                    {/* </div> */}
                                </div>
                                <div class="grid formgrid">
                                    {/* <div className="field col-12 mb-2 lg:col-6"></div> */}
                                    <label htmlFor="">Ambil Gambar :</label>
                                    <CameraCapture />
                                </div>
                            </div>
                        </TabPanel>
                    </TabView>
                    <Toolbar className="mb-4" right={produkFooter}></Toolbar>
                    {/* Dialog Golongan */}
                    <Dialog visible={golonganDialog} style={{ width: '75%' }} header="Golongan" modal className="p-fluid" onHide={hideDialogGolongan}>
                        {loadingItem && <TabelSkaleton items={itemsSkelatonGolongan} kolom={columnsGolongan} />}
                        {!loadingItem && (
                            <DataTable
                                value={golonganTabel}
                                size="small"
                                lazy
                                dataKey="KODE"
                                paginator
                                rows={10}
                                onRowSelect={onRowSelectGolongan}
                                className="datatable-responsive"
                                first={lazyState.first}
                                totalRecords={totalRecords}
                                onPage={onPage}
                                loading={loading}
                                selectionMode="single" // Memungkinkan pemilihan satu baris
                            >
                                <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN"></Column>
                            </DataTable>
                        )}
                    </Dialog>

                    {/* Dialog Rak */}
                    <Dialog visible={rakDialog} style={{ width: '75%' }} header="Rak" modal className="p-fluid" onHide={hideDialogRak}>
                        {loadingItem && <TabelSkaleton items={itemsSkelatonGolongan} kolom={columnsGolongan} />}
                        {!loadingItem && (
                            <DataTable
                                value={rakTabel}
                                lazy
                                size="small"
                                dataKey="KODE"
                                paginator
                                rows={10}
                                className="datatable-responsive"
                                first={lazyState.first}
                                totalRecords={totalRecords}
                                onPage={onPage}
                                loading={loading}
                                onRowSelect={onRowSelectRak}
                                selectionMode="single" // Memungkinkan pemilihan satu baris
                            >
                                <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN"></Column>
                            </DataTable>
                        )}
                    </Dialog>

                    {/* Dialog Gudang */}
                    <Dialog visible={gudangDialog} style={{ width: '75%' }} header="Gudang" modal className="p-fluid" onHide={hideDialogGudang}>
                        {loadingItem && <TabelSkaleton items={itemsSkelatonGolongan} kolom={columnsGolongan} />}
                        {!loadingItem && (
                            <DataTable
                                value={gudangTabel}
                                size="small"
                                lazy
                                dataKey="KODE"
                                paginator
                                rows={10}
                                className="datatable-responsive"
                                first={lazyState.first}
                                totalRecords={totalRecords}
                                onPage={onPage}
                                loading={loading}
                                onRowSelect={onRowSelectGudang}
                                selectionMode="single" // Memungkinkan pemilihan satu baris
                            >
                                <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN"></Column>
                            </DataTable>
                        )}
                    </Dialog>

                    {/* Dialog Supplier */}
                    <Dialog visible={supplierDialog} style={{ width: '75%' }} header="Supplier" modal className="p-fluid" onHide={hideDialogSupplier}>
                        {loadingItem && <TabelSkaleton items={itemsSkelatonSupplier} kolom={columnsSupplier} />}
                        {!loadingItem && (
                            <DataTable
                                value={supplierTabel}
                                size="small"
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
                                <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="ALAMAT" header="ALAMAT"></Column>
                            </DataTable>
                        )}
                    </Dialog>

                    {/* Dialog Satuan 1 */}
                    <Dialog visible={satuanDialog} style={{ width: '75%' }} header="Satuan 1" modal className="p-fluid" onHide={hideDialogSatuan}>
                        {loadingItem && <TabelSkaleton items={itemsSkelatonGolongan} kolom={columnsGolongan} />}
                        {!loadingItem && (
                            <DataTable
                                value={satuanTabel}
                                size="small"
                                lazy
                                dataKey="KODE"
                                paginator
                                rows={10}
                                className="datatable-responsive"
                                first={lazyState.first}
                                totalRecords={totalRecords}
                                onPage={onPage}
                                loading={loading}
                                onRowSelect={onRowSelectSatuan}
                                selectionMode="single" // Memungkinkan pemilihan satu baris
                            >
                                <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN"></Column>
                            </DataTable>
                        )}
                    </Dialog>

                    {/* Dialog Satuan 2 */}
                    <Dialog visible={satuan2Dialog} style={{ width: '75%' }} header="Satuan 2" modal className="p-fluid" onHide={hideDialogSatuan2}>
                        {loadingItem && <TabelSkaleton items={itemsSkelatonGolongan} kolom={columnsGolongan} />}
                        {!loadingItem && (
                            <DataTable
                                value={satuanTabel}
                                size="small"
                                lazy
                                dataKey="KODE"
                                paginator
                                rows={10}
                                className="datatable-responsive"
                                first={lazyState.first}
                                totalRecords={totalRecords}
                                onPage={onPage}
                                loading={loading}
                                onRowSelect={onRowSelectSatuan2}
                                selectionMode="single" // Memungkinkan pemilihan satu baris
                            >
                                <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN"></Column>
                            </DataTable>
                        )}
                    </Dialog>

                    {/* Dialog Satuan 3 */}
                    <Dialog visible={satuan3Dialog} style={{ width: '75%' }} header="Satuan 3" modal className="p-fluid" onHide={hideDialogSatuan3}>
                        {loadingItem && <TabelSkaleton items={itemsSkelatonGolongan} kolom={columnsGolongan} />}
                        {!loadingItem && (
                            <DataTable
                                value={satuanTabel}
                                size="small"
                                lazy
                                dataKey="KODE"
                                paginator
                                rows={10}
                                className="datatable-responsive"
                                first={lazyState.first}
                                totalRecords={totalRecords}
                                onPage={onPage}
                                loading={loading}
                                onRowSelect={onRowSelectSatuan3}
                                selectionMode="single" // Memungkinkan pemilihan satu baris
                            >
                                <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN"></Column>
                            </DataTable>
                        )}
                    </Dialog>

                    {/* Dialog Nama Produk */}
                    <Dialog visible={namaProdukDialog} style={{ width: '75%' }} header="Nama Produk" modal className="p-fluid" onHide={hideDialogNamaProduk}>
                        {loadingItem && <TabelSkaleton items={itemsSkelatonNamaProduk} kolom={columnsNamaProduk} />}
                        {!loadingItem && (
                            <DataTable
                                value={namaProdukTabel}
                                size="small"
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
                                <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA"></Column>
                            </DataTable>
                        )}
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
// export default AddPage;

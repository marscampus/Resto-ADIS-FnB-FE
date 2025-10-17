import axios from 'axios';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { classNames } from 'primereact/utils';
import React, { useEffect, useRef, useState } from 'react';
import TabelSkaleton from '../../../component/tabel/skaleton';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Checkbox } from 'primereact/checkbox';
import { Calendar } from 'primereact/calendar';
import { useRouter } from 'next/router';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { Dropdown } from 'primereact/dropdown';
import { formatDate } from '../../../component/GeneralFunction/GeneralFunction';
import styles from '../../../component/styles/dataTable.module.css';

export default function MasterData() {
    const breadcrumbHome = { icon: 'pi pi-home', to: '/' };
    const breadcrumbItems = [{ label: 'Pembelian' }, { label: 'Retur Pembelian' }, { label: 'Add', to: '#' }];

    const apiDirPath = '/api/api_crud_kode';
    const apiEndPointGetFakturPembelian = '/api/rtnpembelian_faktur/get_fakturpembelian';
    const apiEndPointGetDataByFakturPembelian = '/api/rtnpembelian_faktur/getdata_faktur';
    const apiEndPointGetFaktur = '/api/rtnpembelian_faktur/get_faktur';
    const apiEndPointStore = '/api/rtnpembelian_faktur/store';
    let emptyretur = {
        FAKTUR: null,
        TGL: null,
        TGLDO: null,
        FAKTURPEMBELIAN: null,
        FAKTURASLI: null,
        JTHTMP: null,
        SUPPLIER: null,
        KETERANGAN: null
    };

    // let emptyretur = {
    //     FAKTUR: null,
    //     FAKTURTERIMA: null,
    //     FAKTURPO: null,
    //     TGL: null,
    //     JTHTMP: null,
    //     FAKTURASLI: null,
    //     SUPPLIER: null,
    //     SUBTOTAL: null,
    //     TOTDISCOUNT: null,
    //     TOTPAJAK: null,
    //     TOTAL: null,
    //     GUDANG: null,
    //     KODEP: null,
    //     BARCODE: null,
    //     QTYP: null,
    //     HARGA: null,
    //     SATUANP: null,
    //     DISCOUNTP: null,
    //     PPNP: null,
    //     JUMLAHP: null
    // };

    const router = useRouter();
    const dt = useRef(null);
    const toast = useRef(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [retur, setRetur] = useState(emptyretur);
    const [returDialog, setReturDialog] = useState(false);
    const [supplierDialog, setSupplierDialog] = useState(false);
    const [supplierTabel, setSupplierTabel] = useState(null);
    const [fakturPembelianDialog, setFakturPembelianDialog] = useState(false);
    const [fakturPembelianTabel, setFakturPembelianTabel] = useState(null);
    const [statusAction, setStatusAction] = useState(null);
    const [keteranganNamaProduk, setKeteranganNamaProduk] = useState('');
    const [keteranganSatuan, setKeteranganSatuan] = useState('');
    const [keteranganHarga, setKeteranganHarga] = useState('');
    // BY DHEA
    const [keteranganFakturTerima, setKeteranganFakturTerima] = useState('');
    const [keteranganFaktur, setKeteranganFaktur] = useState('');
    const [keteranganTgl, setKeteranganTgl] = useState(new Date());
    const [keteranganTglPo, setKeteranganTglPO] = useState(formatDate(new Date()));
    const [keteranganTglDo, setKeteranganTglDO] = useState(formatDate(new Date()));
    const [keteranganJthTmp, setKeteranganJthTmp] = useState(formatDate(new Date()));
    const [keteranganFakturAsli, setKeteranganFakturAsli] = useState('');
    const [keteranganGudang, setKeteranganGudang] = useState('');
    const [keteranganNamaGudang, setKeteranganNamaGudang] = useState('');
    const [keteranganSupplier, setKeteranganSupplier] = useState('');
    const [keteranganNamaSupplier, setKeteranganNamaSupplier] = useState('');
    const [keteranganAlamatSupplier, setKeteranganAlamatSupplier] = useState('');
    const [keteranganKotaSupplier, setKeteranganKotaSupplier] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [defaultOption, setDropdownValue] = useState(null);
    const [addRetur, setAddRetur] = useState([]);
    const [addReturDiscount, setAddReturDiscount] = useState('');
    const [addReturPpn, setAddReturPpn] = useState('');

    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    const itemsSkelaton = Array.from({ length: 2 }, (v, i) => i);
    const columns = [{ field: 'KODE', header: 'KODE' }];
    const columnsSupplier = [
        { field: 'KODE', header: 'KODE' },
        { field: 'NAMA', header: 'NAMA' },
        { field: 'ALAMAT', header: 'ALAMAT' }
    ];

    const columnsFakturPembelian = [
        { field: 'FAKTUR', header: 'FAKTUR PEMBELIAN' },
        { field: 'FAKTURPO', header: 'FAKTUR PO' },
        { field: 'SUPPLIER', header: 'SUPPLIER' },
        { field: 'TOTAL', header: 'TOTAL' },
        { field: 'TGL', header: 'TGL' },
        { field: 'JTHTMP', header: 'JATUH TEMPO' },
        { field: 'KETERANGAN', header: 'KETERANGAN' },
        { field: 'TERIMABRG', header: 'TERIMA BARANG' },
        { field: 'POBRG', header: 'PO BARANG' },
        { field: 'BRGRETUR', header: 'BARANG RETUR' }
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
    };

    const loadLazyData = async () => {
        try {
            let requestBody = {
                KODE: 'RB',
                LEN: '3'
            };
            const header = { 'Content-Type': 'application/json;charset=UTF-8', 'X-ENDPOINT': apiEndPointGetFaktur };
            const vaTable = await axios.post(apiDirPath, requestBody, { headers: header });
            const json = vaTable.data;
            setTotalRecords(json.total);
            setKeteranganFaktur(json);
            setRetur((prevRetur) => ({
                ...prevRetur,
                FAKTUR: json
            }));
        } catch (error) {
            console.error('Error while loading data:', error);
        } finally {
            setLoading(false);
        }
        // setLoading(false);
    };

    const onInputChangeBarcode = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _barcode = { ...retur };
        _barcode[`${name}`] = val;
        setRetur(_data);
        if (name === 'STATUS') {
            setStatus(e.target.checked ? 1 : 0);
        }
        // console.log(_barcode);
    };

    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        let _data = { ...retur };
        _data[`${name}`] = val;

        setRetur(_data);
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _data = { ...retur };
        _data[`${name}`] = val;
        setRetur(_data);
        // console.log(_data);
        if (name === 'TGL' && val === '') {
            const today = new Date();
            // const formattedDate = formatDate(today);
            const formattedDate = today;
            let _retur = { ...retur };
            dateFields.forEach((field) => {
                _retur[field] = formattedDate;
                setRetur(_retur);
            });
            setKeteranganTgl(formattedDate);
        }

        // if (name === 'TGLPO' && val === '') {
        //     const today = new Date();
        //     const formattedDate = formatDate(today);
        //     let _retur = { ...retur };
        //     dateFields.forEach((field) => {
        //         _retur[field] = formattedDate;
        //         setRetur(_retur);
        //     });
        //     setKeteranganTglPO(formattedDate);
        // }

        // if (name === 'TGLDO' && val === '') {
        //     const today = new Date();
        //     const formattedDate = formatDate(today);
        //     let _retur = { ...retur };
        //     dateFields.forEach((field) => {
        //         _retur[field] = formattedDate;
        //         setRetur(_retur);
        //     });
        //     setKeteranganTglDO(formattedDate);
        // }

        // if (name === 'JTHTMP' && val === '') {
        //     const today = new Date();
        //     const formattedDate = formatDate(today);
        //     let _retur = { ...retur };
        //     dateFields.forEach((field) => {
        //         _retur[field] = formattedDate;
        //         setRetur(_retur);
        //     });
        //     setKeteranganJthTmp(formattedDate);
        // }
    };
    const [globalFilter, setGlobalFilter] = useState('');
    const clearFilter = () => {
        setGlobalFilter('');
    };
    const setNull = () => {
        // setRetur(null);
        const emptyretur = {
            FAKTUR: null,
            FAKTURASLI: null,
            TGL: null,
            TGLPO: null,
            TGLDO: null,
            JTHTMP: null,
            GUDANG: null,
            SUPPLIER: null,
            ALAMAT: null,
            KOTA: null,
            KETERANGAN: null
        };
        setRetur(emptyretur);
    };
    // ----------------------------------------------------------------------------------------------------------------- Hide Dialog
    const hideDialog = () => {
        setSubmitted(false);
        setReturDialog(false);
    };

    // -------------------------------------------------------------------------------------------------------------------- Dialog
    const openStokBaru = () => {
        // setRetur(emptycustomer);
        setSubmitted(false);
        setReturDialog(true);
        setStatusAction('store');
    };
    const hideDialogSupplier = () => {
        setSubmitted(false);
        setSupplierDialog(false);
    };

    const hideDialogFakturPembelian = () => {
        setSubmitted(false);
        setFakturPembelianDialog(false);
    };

    // -------------------------------------------------------------------------------------------------------------------- Func
    const convertUndefinedToNull = (obj) => {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    convertUndefinedToNull(obj[key]); // Memanggil fungsi rekursif jika nilai properti adalah objek
                } else if (obj[key] === null) {
                    obj[key] = null; // Mengubah nilai undefined menjadi null
                }
            }
        }
    };

    const createDataObject = (_retur, _addRetur) => {
        // return console.log(totTotal);
        let data = {
            FAKTUR: _retur.FAKTUR,
            TGL: _retur.TGL,
            FAKTURPEMBELIAN: _retur.FAKTURPEMBELIAN,
            FAKTURASLI: _retur.FAKTURASLI,
            JTHTMP: _retur.JTHTMP,
            SUPPLIER: _retur.SUPPLIER,
            GUDANG: _retur.GUDANG,
            SUBTOTAL: totTotal,
            PAJAK: totalPpn,
            DISCOUNT: totalDiscount,
            TOTAL: totJumlah,
            KETERANGAN: _retur.KETERANGAN,
            tabelTransaksiRtnPembelianFaktur: _addRetur
                .map((item) => {
                    const RETUR = item.RETUR !== null ? item.RETUR : 0;
                    if (RETUR > 0) {
                        convertUndefinedToNull(item);
                        // console.log(item);
                        return {
                            KODEP: item.KODE,
                            HARGAP: item.HARGA,
                            QTYP: RETUR,
                            SATUANP: item.SATUAN,
                            DISCOUNTP: item.DISCOUNTPENERIMAAN,
                            PPNP: item.PPNPENERIMAAN,
                            JUMLAHP: item.JUMLAHPENERIMAAN
                        };
                    } else {
                        return null; // Jika retur <= 0, maka null digunakan sebagai placeholder
                    }
                })
                .filter((item) => item !== null) // Menghapus objek yang bernilai null
        };
        // return console.log(data);
        convertUndefinedToNull(data);
        return data;
    };

    const saveData = async (e) => {
        e.preventDefault();
        let _retur = { ...retur };
        let _addRetur = [...addRetur];
        let _data = createDataObject(_retur, _addRetur);
        console.log(_data);
        // setRetur(_retur);
        let header = {};
        let detail = null;
        _addRetur.push(_retur);
        detail = 'Data Berhasil Ditambahkan';
        header = {
            'Content-Type': 'application/json;charset=UTF-8',
            'X-ENDPOINT': apiEndPointStore,
            'X-VALUEUPDATE': ''
        };

        try {
            const vaProcess = await axios.post(apiDirPath, _data, { headers: header });
            let data = vaProcess.data;
            console.log(data);
            setNull();
            if (data.status === 'success') {
                toast.current.show({ severity: 'success', summary: 'Successful', detail: detail, life: 3000 });
                router.push('/pembelian/retur-faktur');
            } else {
                toast.current.show({ severity: 'error', summary: data.message, detail: 'Kesalahan Proses', life: 3000 });

            }
        } catch (error) {
            toast.current.show({ severity: 'error', summary: data.message, detail: 'Kesalahan Proses', life: 3000 });

            console.log(error);
        }
    };

    // Faktur Pembelian -----------------------------------------------------------------------------------------------------------
    const toggleFakturTerima = async () => {
        setLoading(true);
        setFakturPembelianDialog(true);
        let requestBody = { ...lazyState };
        try {
            const header = { 'Content-Type': 'application/json;charset=UTF-8', 'X-ENDPOINT': apiEndPointGetFakturPembelian };
            const vaTable = await axios.post(apiDirPath, requestBody, { headers: header });
            const json = vaTable.data;
            setTotalRecords(json.total);
            setFakturPembelianTabel(json.data);
        } catch (error) {
            console.error('Error while loading data:', error);
        } finally {
            setLoading(false);
        }
        setLoadingItem(false);
    };

    // const dataTableFakturPembelian = (KODE) => {
    //     return new Promise((resolve) => {
    //         return fetch('/api/pembelian/po', {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json', 'X-ACTION': 'get' },
    //             body: JSON.stringify({ KODE: KODE })
    //         })
    //             .then((result) => result.json())
    //             .then((body) => {
    //                 return resolve(body);
    //             });
    //         setFakturPembelianDialog(true);
    //     });
    // };

    const onRowSelectFakturPembelian = async (event) => {
        const selectedFaktur = event.data.FAKTUR;
        let requestBody = {
            FAKTUR: selectedFaktur
        };
        try {
            const header = { 'Content-Type': 'application/json;charset=UTF-8', 'X-ENDPOINT': apiEndPointGetDataByFakturPembelian };
            const vaTable = await axios.post(apiDirPath, requestBody, { headers: header });
            const json = vaTable.data;
            setAddRetur(json.detail);
            // JADI VALUE
            let _fakturPembelian = { ...retur };
            _fakturPembelian.FAKTURPEMBELIAN = json.FAKTUR;
            // _fakturPembelian.FAKTURASLI = json.FAKTURASLI;
            _fakturPembelian.SUPPLIER = json.SUPPLIER;
            _fakturPembelian.TGL = json.TGLPO;
            _fakturPembelian.JTHTMP = json.JTHTMP;
            _fakturPembelian.TGLDO = json.TGLDO;
            const currentDate = new Date();
            _fakturPembelian.TGL = json.TGL || currentDate.toISOString().split('T')[0];
            _fakturPembelian.GUDANG = json.GUDANG;
            // _fakturPembelian.KETERANGAN = json.KETERANGAN;
            _fakturPembelian.KOTA = json.KOTA;
            // console.log(_fakturPembelian);
            setRetur(_fakturPembelian); // INI YAK DI SET DULU :*
            setFakturPembelianTabel(json.FAKTURPEMBELIAN !== null ? json.FAKTURPEMBELIAN : '');
            setKeteranganFakturTerima(json.FAKTUR);
            setKeteranganGudang(json.GUDANG);
            setKeteranganNamaGudang(json.KETGUDANG);
            setAddReturDiscount(json.PERSDISC);
            setKeteranganTglPO(formatDate(json.TGLPO));
            setKeteranganTglDO(formatDate(json.TGLDO));
            setKeteranganJthTmp(formatDate(json.JTHTMP));
            setAddReturPpn(json.PPN);
            setKeteranganSupplier(json.SUPPLIER);
            setKeteranganNamaSupplier(json.NAMA);
            setKeteranganAlamatSupplier(json.ALAMAT);
            setKeteranganKotaSupplier(json.KOTA);
        } catch (error) {
            console.error('Error while loading data:', error);
        } finally {
            setLoading(false);
        }

        setFakturPembelianDialog(false);
    };
    // const updatedAddRetur = addRetur.filter((row) => row.KODE !== rowData.KODE);
    const deleteSelectedRow = (rowData) => {
        // if (selectedRowAddPo) {
        //   const updatedAddPo = addPo.filter(row => row.KODE !== selectedRowAddPo.KODE);
        //   setAddPo(updatedAddPo);
        //   setSelectedRowAddPo(null);
        // }
        const updatedAddRetur = addRetur.filter((row) => row.KODE !== rowData.KODE);
        setAddRetur(updatedAddRetur);
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
            console.log(resSupplier);
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
            let _supplier = { ...retur };
            _supplier.SUPPLIER = selectedSupplier.KODE;
            setRetur(_supplier);

            setKeteranganNamaSupplier(selectedSupplier.NAMA);
            console.log(data);
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
            console.log(resNamaProduk);
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
            console.log(selectedNamaProduk);
            let _namaProduk = { ...po };
            _namaProduk.NAMA = selectedNamaProduk.NAMA;
            setPo(_namaProduk);
            setKeteranganNamaProduk(selectedNamaProduk.NAMA);
            setKeteranganSatuan(selectedNamaProduk.SATUAN);
            setKeteranganHarga(selectedNamaProduk.HB);
            console.log(po);
        }

        setNamaProdukDialog(false);
    };
    //------------------------------------------------------------------------------------------------------- ---------Edit In Row
    const isPositiveInteger = (value) => {
        const parsedValue = parseInt(value, 10);
        return Number.isInteger(parsedValue) && parsedValue > 0;
    };

    const onCellEditComplete = (e) => {
        let { rowData, newValue, field, originalEvent: event } = e;
        switch (field) {
            // Kondisi edit field RETUR, melakukan perhitungan RETUR * HARGA
            case 'RETUR':
                if (newValue === '') {
                    newValue = '0';
                }
                if (isPositiveInteger(newValue) || newValue === '0') {
                    const existingIndex = addRetur.findIndex((item) => item.BARCODE === rowData.BARCODE);
                    const updatedAddRetur = [...addRetur];
                    if (existingIndex !== -1) {
                        // RETUR TIDAK BOLEH MELEBIHI TERIMA
                        const terima = addRetur[existingIndex].TERIMABRG;
                        const persdisc = addReturDiscount / 100;
                        const ppn = addReturPpn / 100;
                        const TOTALPENERIMAAN = parseInt(newValue, 10) * updatedAddRetur[existingIndex].HARGA;
                        const DISCOUNTPENERIMAAN = Math.round(parseInt(newValue, 10) * updatedAddRetur[existingIndex].HARGA * persdisc);
                        const TOTALDISC = TOTALPENERIMAAN - DISCOUNTPENERIMAAN;
                        // const PPNPENERIMAAN = parseInt(newValue, 10) * updatedAddRetur[existingIndex].HARGA * ppn;
                        const PPNPENERIMAAN = Math.round(TOTALDISC * ppn);
                        const JUMLAHPENERIMAAN = TOTALDISC + PPNPENERIMAAN;
                        if (parseInt(newValue, 10) <= terima) {
                            updatedAddRetur[existingIndex] = {
                                ...updatedAddRetur[existingIndex],
                                RETUR: parseInt(newValue, 10),
                                TOTALPENERIMAAN,
                                DISCOUNTPENERIMAAN,
                                PPNPENERIMAAN,
                                JUMLAHPENERIMAAN
                            };
                            setAddRetur(updatedAddRetur);
                        } else {
                            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Jumlah Retur Tidak Boleh Melebihi Terima', life: 3000 });
                            return;
                        }
                    } else {
                        rowData[field] = newValue;
                    }
                } else {
                    event.preventDefault();
                }
                break;

            case 'HARGA':
                if (isPositiveInteger(newValue)) {
                    const existingIndex = addRetur.findIndex((item) => item.BARCODE === rowData.BARCODE);
                    const updatedAddRetur = [...addRetur];
                    const terima = addRetur[existingIndex].TERIMABRG;
                    const persdisc = addReturDiscount / 100;
                    const ppn = addReturPpn / 100;
                    const TOTALPENERIMAAN = parseInt(newValue, 10) * updatedAddRetur[existingIndex].RETUR;
                    const DISCOUNTPENERIMAAN = Math.round(parseInt(newValue, 10) * updatedAddRetur[existingIndex].RETUR * persdisc);
                    const TOTALDISC = TOTALPENERIMAAN - DISCOUNTPENERIMAAN;
                    // const PPNPENERIMAAN = parseInt(newValue, 10) * updatedAddRetur[existingIndex].RETUR * ppn;
                    const PPNPENERIMAAN = Math.round(TOTALDISC * ppn);
                    const JUMLAHPENERIMAAN = TOTALDISC + PPNPENERIMAAN;
                    if (existingIndex !== -1) {
                        // const updatedAddRetur = [...addRetur];
                        updatedAddRetur[existingIndex] = {
                            ...updatedAddRetur[existingIndex],
                            HARGA: parseInt(newValue, 10),
                            TOTALPENERIMAAN,
                            DISCOUNTPENERIMAAN,
                            PPNPENERIMAAN,
                            JUMLAHPENERIMAAN
                            //  TOTAL - DICOUNT + PPN
                        };
                        setAddRetur(updatedAddRetur);
                    } else {
                        rowData[field] = newValue;
                    }
                } else {
                    event.preventDefault();
                }
                break;

            case 'PPNPENERIMAAN':
                if (isPositiveInteger(newValue) || newValue === '0') {
                    const existingIndex = addRetur.findIndex((item) => item.BARCODE === rowData.BARCODE);
                    if (existingIndex !== -1) {
                        const updatedAddRetur = [...addRetur];
                        const terima = addRetur[existingIndex].TERIMABRG;
                        const persdisc = addReturDiscount / 100;
                        const ppn = addReturPpn / 100;
                        const TOTALPENERIMAAN = updatedAddRetur[existingIndex].RETUR * updatedAddRetur[existingIndex].HARGA;
                        const DISCOUNTPENERIMAAN = Math.round(TOTALPENERIMAAN * persdisc);
                        const TOTALDISC = TOTALPENERIMAAN - DISCOUNTPENERIMAAN;
                        const PPNPENERIMAAN = Math.round(TOTALDISC * ppn);
                        // const JUMLAHPENERIMAAN = TOTALDISC + PPNPENERIMAAN;
                        const JUMLAHPENERIMAAN = TOTALDISC + parseInt(newValue, 10);
                        updatedAddRetur[existingIndex] = {
                            ...updatedAddRetur[existingIndex],
                            PPNPENERIMAAN: parseInt(newValue, 10),
                            TOTALPENERIMAAN,
                            DISCOUNTPENERIMAAN,
                            // PPNPENERIMAAN,
                            JUMLAHPENERIMAAN
                        };
                        setAddRetur(updatedAddRetur);
                    } else {
                        rowData[field] = newValue;
                    }
                } else {
                    event.preventDefault();
                }
                break;
            default:
                if (newValue.trim().length > 0) rowData[field] = newValue;
                else event.preventDefault();
                break;
        }
    };

    //------------------------------------------------------------------------------------------------------------------CALCULATE
    const cellEditor = (options) => {
        // if (options.field === 'TERIMA')
        //     return terimaEditor(options);
        // else
        return textEditor(options);
    };

    const textEditor = (options) => {
        return <InputText type="text" value={options.value} onChange={(e) => options.editorCallback(e.target.value)} />;
    };

    // ---------------------------------------------------------------------------------------------------------------- Button
    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-trash" className="p-button-danger p-button-outlined mr-2" onClick={() => deleteSelectedRow(rowData)} />
            </>
        );
    };
    const rightFooterTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    {/* <Button label="Delete" className="p-button-danger p-button-outlined mr-2" /> */}
                    <Button label="Save" className="p-button-primary p-button mr-2" onClick={saveData} />
                    <Button
                        label="Cancel"
                        className="p-button-secondary p-button"
                        onClick={() => {
                            router.push('/pembelian/retur-faktur');
                        }}
                    />
                </div>
            </React.Fragment>
        );
    };
    const leftFooterTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <div className="formgrid grid">
                        <div className="field col-12 mb-2 lg:col-4">
                            <Checkbox inputId="status" value={retur.STATUS} onChange={(e) => onInputChangeBarcode(e, 'STATUS')} style={{ marginRight: '5px' }} />
                            <label htmlFor="Konsinyasi">Konsinyasi</label>
                        </div>
                        <div className="field col-12 mb-2 lg:col-4">
                            <label htmlFor="faktur">Faktur PO</label>
                            <div className="p-inputgroup">
                                <InputText value={retur.FAKTURPO} onChange={(e) => onInputChange(e, 'FAKTURPO')} required className={classNames({ 'p-invalid': submitted && !retur.FAKTURPO })} />
                                <Button icon="pi pi-search" className="p-button" />
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    };
    const dataDialogFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveData} />
        </>
    );

    const stokBaruFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" className="p-button-text" />
        </>
    );

    const totQty = addRetur.reduce((accumulator, item) => accumulator + parseFloat(item.QTYPO), 0);
    const totTerima = addRetur.reduce((accumulator, item) => accumulator + parseFloat(item.TERIMABRG), 0);
    const totRetur = addRetur.reduce((accumulator, item) => {
        const returValue = parseFloat(item.RETUR);
        return isNaN(returValue) ? accumulator : accumulator + returValue;
    }, 0);
    const totHarga = addRetur.reduce((accumulator, item) => {
        const hargaValue = parseFloat(item.HARGA);
        return isNaN(hargaValue) ? accumulator : accumulator + hargaValue;
    }, 0);
    const totTotal = addRetur.reduce((accumulator, item) => {
        const totalValue = parseFloat(item.TOTALPENERIMAAN);
        return isNaN(totalValue) ? accumulator : accumulator + totalValue;
    }, 0);
    const totDisc = addRetur.reduce((accumulator, item) => {
        const discValue = parseFloat(item.DISCOUNTPENERIMAAN);
        return isNaN(discValue) ? accumulator : accumulator + discValue;
    }, 0);
    const totalDiscount = isNaN(totDisc) || totDisc === undefined ? 0 : totDisc;
    const totPpn = addRetur.reduce((accumulator, item) => {
        const ppnValue = parseFloat(item.PPNPENERIMAAN);
        return isNaN(ppnValue) ? accumulator : accumulator + ppnValue;
    }, 0);
    const totalPpn = isNaN(totPpn) || totPpn === undefined ? 0 : totPpn;
    const totJumlah = addRetur.reduce((accumulator, item) => {
        const jumlahValue = parseFloat(item.JUMLAHPENERIMAAN);
        return isNaN(jumlahValue) ? accumulator : accumulator + jumlahValue;
    }, 0);
    const totalJumlah = isNaN(totJumlah) || totJumlah === undefined ? 0 : totJumlah;

    let footerGroup = (
        <ColumnGroup>
            <Row>
                <Column headerStyle={{ textAlign: "center" }} footer="Total:" colSpan={2} footerStyle={{ textAlign: 'right' }} />
                {/* <Column headerStyle={{ textAlign: "center" }} footer="Data" /> */}
                <Column headerStyle={{ textAlign: "center" }} colSpan={1} footer={totQty.toString()} />
                <Column headerStyle={{ textAlign: "center" }} colSpan={1} footer={totTerima.toString()} />
                <Column headerStyle={{ textAlign: "center" }} colSpan={3} footer={totRetur.toString()} />
                {/* <Column headerStyle={{ textAlign: "center" }} colSpan={1} footer={(rowData) => totHarga.toLocaleString()} /> */}
                <Column headerStyle={{ textAlign: "center" }} colSpan={1} footer={(rowData) => totTotal.toLocaleString()} />
                <Column headerStyle={{ textAlign: "center" }} colSpan={1} footer={(rowData) => totalDiscount.toLocaleString()} />
                <Column headerStyle={{ textAlign: "center" }} colSpan={1} footer={(rowData) => totalPpn.toLocaleString()} />
                <Column headerStyle={{ textAlign: "center" }} colSpan={1} footer={(rowData) => totalJumlah.toLocaleString()} />
            </Row>
        </ColumnGroup>
    );
    const dropdownValues = [
        { name: 'FAKTUR', label: 'FAKTUR' },
        { name: 'SUPPLIER', label: 'SUPPLIER' }
    ];
    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center" style={{ marginBottom: '15px' }}>
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
        let _lazyState = { ...lazyState };
        _lazyState['filters'] = {};
        if (defaultOption != null && defaultOption.name != null) {
            _lazyState['filters'][defaultOption.name] = value;
        }
        onPage(_lazyState);
    };
    //-------------------------------------------------------------------SEARCH
    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <BreadCrumb home={breadcrumbHome} model={breadcrumbItems} style={{ background: 'none', border: 'none' }} />
                <div className="card">
                    <h4>Add Retur Pembelian</h4>
                    <hr />
                    <Toast ref={toast} />
                    <div>
                        <div className="formgrid grid">
                            <div className="field col-3 mb-2 lg:col-3">
                                <label htmlFor="faktur">Faktur Terima</label>
                                <div className="p-inputgroup">
                                    <InputText
                                        readOnly
                                        value={keteranganFakturTerima || ''} // Menggunakan operator OR (||) untuk memberikan nilai kosong jika retur.FAKTURTERIMA bernilai null
                                        onChange={(e) => onInputChange(e, 'FAKTURTERIMA')}
                                        required
                                        className={classNames({ 'p-invalid': submitted && !keteranganFakturTerima })}
                                    />

                                    {/* <InputText readOnly value={retur.FAKTURTERIMA} onChange={(e) => onInputChange(e, 'PO')} required className={classNames({ 'p-invalid': submitted && !retur.FAKTURTERIMA })} /> */}
                                    <Button icon="pi pi-search" className="p-button" onClick={toggleFakturTerima} />
                                </div>
                            </div>
                            <div className="field col-3 mb-2 lg:col-3">
                                <label htmlFor="faktur">Faktur</label>
                                <div className="p-inputgroup">
                                    {
                                        <InputText value={keteranganFaktur} readOnly />
                                        /* <InputText value={retur.FAKTUR} readOnly /> */
                                    }
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-6">
                                <label htmlFor="fakturasli">Faktur Asli</label>
                                <div className="p-inputgroup">
                                    <InputText value={retur.FAKTURASLI} onChange={(e) => onInputChange(e, 'FAKTURASLI')} required autoFocus className={classNames({ 'p-invalid': submitted && !retur.FAKTURASLI })} />
                                </div>
                            </div>
                        </div>
                        <div className="formgrid grid">
                            <div className="field col-3 mb-2 lg:col-3">
                                <label htmlFor="tanggal">Tanggal Faktur</label>
                                <div className="p-inputgroup">
                                    <Calendar id="tgl" value={keteranganTgl} onChange={(e) => onInputChange(e, 'TGL')} showIcon dateFormat="dd-mm-yy" />
                                </div>
                            </div>
                            <div className="field col-3 mb-2 lg:col-3">
                                <label htmlFor="tanggal">Tanggal PO</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly id="tanggalpo" value={keteranganTglPo} onChange={(e) => onInputChange(e, 'TGLPO')} dateFormat="dd-mm-yy" />
                                    <Button icon="pi pi-calendar" className="p-button" />
                                    {/* <InputText readOnly id="tanggalpo" value={formatDate(keteranganTglPo) || formatDate(new Date())} onChange={(e) => onInputChange(e, 'TGLPO')} showIcon dateFormat="dd-mm-yy" /> */}
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-6">
                                <label htmlFor="gudang">Gudang</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly id="gudang_kode" value={keteranganGudang} />
                                    <InputText readOnly id="ket-Gudang" value={keteranganNamaGudang} />
                                </div>
                                {submitted && !keteranganGudang && <small className="p-invalid">Gudang is required.</small>}
                            </div>
                        </div>
                        <div className="formgrid grid">
                            <div className="field col-3 mb-2 lg:col-3">
                                <label htmlFor="tanggalDO">Tanggal DO</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly id="tglDO" value={keteranganTglDo} onChange={(e) => onInputChange(e, 'TGLDO')} dateFormat="dd-mm-yy" />
                                    <Button icon="pi pi-calendar" className="p-button" />
                                </div>
                            </div>
                            <div className="field col-3 mb-2 lg:col-3">
                                <label htmlFor="tanggal">Jatuh Tempo</label>
                                <div className="p-inputgroup">
                                    <InputText id="jatuhtempo" value={keteranganJthTmp} onChange={(e) => onInputChange(e, 'JTHTMP')} dateFormat="dd-mm-yy" readOnly />
                                    <Button icon="pi pi-calendar" className="p-button" />
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-6">
                                <label htmlFor="supplier">Supplier</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly id="supplier_kode" value={keteranganSupplier} />
                                    {/* <Button icon="pi pi-search" className="p-button" onClick={toggleSupplier} /> */}
                                    {/* <InputText readOnly id="ket-Supplier" value={keteranganNamaSupplier} /> */}
                                    <InputText readOnly id="ket-Supplier" value={keteranganNamaSupplier} />
                                </div>
                                {submitted && !keteranganSupplier && <small className="p-invalid">Supplier is required.</small>}
                            </div>
                        </div>
                        <div className="formgrid grid">
                            <div className="field col-6 mb-2 lg:col-6">
                                <label htmlFor="keterangan">Keterangan</label>
                                <div className="p-inputgroup">
                                    <InputText value={retur.KETERANGAN} onChange={(e) => onInputChange(e, 'KETERANGAN')} required autoFocus className={classNames({ 'p-invalid': submitted && !retur.KETERANGAN })} />
                                    {/* <InputText value={keterangan} onChange={(e) => onInputChange(e, 'KETERANGAN')} required autoFocus className={classNames({ 'p-invalid': submitted && !retur.KETERANGAN })} /> */}
                                </div>
                            </div>
                            <div className="field col-4 mb-2 lg:col-4">
                                <label htmlFor="kota">Alamat</label>
                                <div className="p-inputgroup">
                                    {/* <InputText readOnly id="ket-Supplier" value={keteranganAlamatSupplier} /> */}
                                    <InputText readOnly id="alamat-Supplier" value={retur.ALAMAT} />

                                    {/* {submitted && !pembelian.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
                                </div>
                            </div>
                            <div className="field col-2 mb-2 lg:col-2">
                                <label htmlFor="kota">Kota</label>
                                <div className="p-inputgroup">
                                    <InputText value={retur.KOTA} onChange={(e) => onInputChange(e, 'KOTA')} required autoFocus className={classNames({ 'p-invalid': submitted && !retur.KOTA })} />

                                    {/* <InputText value={keteranganKotaSupplier} onChange={(e) => onInputChange(e, 'KOTA')} required autoFocus className={classNames({ 'p-invalid': submitted && !retur.KOTA })} /> */}
                                    {/* {submitted && !pembelian.KODE_TOKO && <small className="p-invalid">Barcode is required.</small>} */}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* <div className="my-2 text-right">
                        <Button label="Add" className="p-button-primary p-button-sm mr-2" onClick={openStokBaru} />
                    </div><hr></hr> */}
                    <div className={styles.datatableContainer}>
                        <DataTable
                            value={addRetur}
                            lazy
                            dataKey="KODE_TOKO"
                            // paginator
                            rows={10}
                            className="datatable-responsive"
                            first={lazyState.first}
                            totalRecords={totalRecords}
                            onPage={onPage}
                            loading={loading}
                            footerColumnGroup={footerGroup}
                            size="small"
                        >
                            <Column headerStyle={{ textAlign: "center" }} field="BARCODE" header="BARCODE"></Column>
                            <Column headerStyle={{ textAlign: "center" }} field="NAMA" header="NAMA"></Column>
                            <Column headerStyle={{ textAlign: "center" }}
                                field="QTYPO"
                                header="QTY"
                                body={(rowData) => {
                                    const value = rowData.QTYPO ? parseInt(rowData.QTYPO).toLocaleString() : '0';
                                    return value;
                                }}
                            ></Column>
                            <Column headerStyle={{ textAlign: "center" }}
                                field="TERIMABRG"
                                header="TERIMA"
                                body={(rowData) => {
                                    const value = rowData.TERIMABRG ? parseInt(rowData.TERIMABRG).toLocaleString() : '0';
                                    return value;
                                }}
                            ></Column>
                            <Column headerStyle={{ textAlign: "center" }}
                                field="RETUR"
                                header="RETUR"
                                editor={(options) => cellEditor(options)}
                                onCellEditComplete={onCellEditComplete}
                                body={(rowData) => {
                                    const value = rowData.RETUR ? parseInt(rowData.RETUR).toLocaleString() : '0';
                                    return value;
                                }}
                            ></Column>
                            <Column headerStyle={{ textAlign: "center" }} field="SATUAN" header="SATUAN"></Column>
                            <Column headerStyle={{ textAlign: "center" }} field="HARGA" header="HARGA" body={(rowData) => (rowData.HARGA ? rowData.HARGA.toLocaleString() : 0)} editor={(options) => cellEditor(options)} onCellEditComplete={onCellEditComplete}></Column>
                            <Column headerStyle={{ textAlign: "center" }} field="TOTALPENERIMAAN" header="TOTAL" body={(rowData) => (rowData.TOTALPENERIMAAN ? rowData.TOTALPENERIMAAN.toLocaleString() : 0)}></Column>
                            <Column headerStyle={{ textAlign: "center" }} field="DISCOUNTPENERIMAAN" header="DISCOUNT" body={(rowData) => (rowData.DISCOUNTPENERIMAAN ? rowData.DISCOUNTPENERIMAAN.toLocaleString() : 0)}></Column>
                            <Column headerStyle={{ textAlign: "center" }}
                                field="PPNPENERIMAAN"
                                header="PPN"
                                onCellEditComplete={onCellEditComplete}
                                body={(rowData) => (rowData.PPNPENERIMAAN ? rowData.PPNPENERIMAAN.toLocaleString() : 0)}
                                editor={(options) => cellEditor(options)}
                            ></Column>
                            <Column headerStyle={{ textAlign: "center" }} field="JUMLAHPENERIMAAN" header="JUMLAH" body={(rowData) => (rowData.JUMLAHPENERIMAAN ? rowData.JUMLAHPENERIMAAN.toLocaleString() : 0)}></Column>
                        </DataTable>
                    </div>
                    <br></br>
                    <Toolbar className="mb-4" right={rightFooterTemplate}></Toolbar>

                    {/* Dialog Faktur Terima */}
                    <Dialog visible={fakturPembelianDialog} style={{ width: '90%' }} header="Faktur Terima" modal className="p-fluid" onHide={hideDialogFakturPembelian}>
                        {loadingItem && <TabelSkaleton items={itemsSkelaton} kolom={columnsFakturPembelian} />}
                        {!loadingItem && (
                            <DataTable
                                ref={dt}
                                size="small"
                                value={fakturPembelianTabel}
                                lazy
                                dataKey="FAKTURPO"
                                paginator
                                rows={10}
                                className="datatable-responsive"
                                first={lazyState.first}
                                totalRecords={totalRecords}
                                onPage={onPage}
                                loading={loading}
                                onRowSelect={onRowSelectFakturPembelian}
                                selectionMode="single" // Memungkinkan pemilihan satu baris
                                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageRedatart RowsPerPageDropdown"
                                currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                                filters={lazyState.filters}
                                header={headerSearch}
                                emptyMessage="Data Kosong"
                            >
                                <Column headerStyle={{ textAlign: "center" }} field="FAKTUR" header="FAKTUR PEMBELIAN"></Column>
                                <Column headerStyle={{ textAlign: "center" }} field="FAKTURPO" header="FAKTUR PO"></Column>
                                <Column headerStyle={{ textAlign: "center" }} field="SUPPLIER" header="SUPPLIER"></Column>
                                <Column headerStyle={{ textAlign: "center" }} field="TOTAL" header="TOTAL"></Column>
                                <Column headerStyle={{ textAlign: "center" }} field="TGL" header="TGL"></Column>
                                <Column headerStyle={{ textAlign: "center" }} field="JTHTMP" header="JATUH TEMPO"></Column>
                                <Column headerStyle={{ textAlign: "center" }} field="KETERANGAN" header="KETERANGAN"></Column>
                                <Column headerStyle={{ textAlign: "center" }} field="TERIMABRG" header="TERIMA BARANG"></Column>
                                <Column headerStyle={{ textAlign: "center" }} field="POBRG" header="PO BARANG"></Column>
                                <Column headerStyle={{ textAlign: "center" }} field="BRGRETUR" header="BARANG RETUR"></Column>
                            </DataTable>
                        )}
                    </Dialog>
                </div>
            </div>
        </div>
    );
}

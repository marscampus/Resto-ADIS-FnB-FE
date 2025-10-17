/**
     * Nama Program: GODONG POS - Pembelian - Retur Pembelian
     * Pengembang: Salsabila Emma
     * Tanggal Pengembangan: 1 Maret 2024
     * Versi: 1.1.0

    Catatan:
    - Versi 1.1.0 mencakup fungsionalitas Menu Retur Pembelian
*/
import { useRouter } from 'next/router';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Row } from 'primereact/row';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { classNames } from 'primereact/utils';
import React, { useEffect, useRef, useState } from 'react';
import { formatDateSave, showError, showSuccess } from '../../../../component/GeneralFunction/GeneralFunction';
import styles from '../../../../component/styles/dataTable.module.css';
import Gudang from '../../../component/gudang';
import Produk from '../../../component/produk';
import Supplier from '../../../component/supplier';

import postData from '../../../../lib/Axios';
import { getSessionServerSide } from '../../../../utilities/servertool';
export const getServerSideProps = async (context) => {
    const sessionData = await getSessionServerSide(context, '/pembelian/retur');
    if (sessionData?.redirect) {
        return sessionData;
    }
    // const { id } = context.params;
    return {
        props: {
            _A2F: context?.req?.cookies['_A2F']
        }
    };
};
export default function MasterData() {
    const apiEndPointGetBarcode = '/api/produk/get-barcode';
    const apiEndPointGetFaktur = '/api/get_faktur';
    const apiEndPointStore = '/api/rtnpembelian/store';
    const apiEndPointGetDataEdit = '/api/rtnpembelian/getdata_edit';
    const apiEndPointUpdate = '/api/rtnpembelian/update';

    const router = useRouter();
    const dt = useRef(null);
    const toast = useRef(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [retur, setRetur] = useState([]);
    const [supplierTabel, setSupplierTabel] = useState(null);
    const [keteranganFaktur, setKeteranganFaktur] = useState('');
    const [keteranganTgl, setKeteranganTgl] = useState(new Date());
    const [keteranganSupplier, setKeteranganSupplier] = useState('');
    const [keteranganNamaSupplier, setKeteranganNamaSupplier] = useState('');
    const [keteranganAlamatSupplier, setKeteranganAlamatSupplier] = useState('');
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
    const columns = [{ field: 'Loading...', header: 'Loading...' }];

    const op = useRef(null);

    const onPage = (event) => {
        setlazyState(event);
    };

    const [faktur, setFaktur] = useState(null);
    const [readOnlyEdit, setReadOnlyEdit] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);

    // useEffect(() => {
    //     loadLazyData();
    // }, [lazyState]);

    useEffect(() => {
        const { status } = router.query;
        const FAKTUR = localStorage.getItem('FAKTUR');
        if (status === 'update') {
            setKeteranganFaktur(FAKTUR);
            fetchDataForEdit();
            setReadOnlyEdit(true);
            setIsUpdateMode(true); // Set state isUpdateMode to true
        } else {
            loadLazyData();
            setIsUpdateMode(false); // Set state isUpdateMode to false
        }
    }, [router.query]);

    const refreshTabel = () => {
        let getLazyState = { ...lazyState };
        setlazyState(getLazyState);
    };

    const loadLazyData = async () => {
        try {
            let requestBody = {
                Kode: 'RB',
                Len: 6
            };
            const vaTable = await postData(apiEndPointGetFaktur, requestBody);
            const json = vaTable.data;
            setTotalRecords(json.total);
            setKeteranganFaktur(json);
            setRetur((prevRetur) => ({
                ...prevRetur,
                FAKTUR: json
            }));
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
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

    // ----------------------------------------------------------------------------------------------------------------------------< EDIT AREA >
    const fetchDataForEdit = async () => {
        const FAKTUR = localStorage.getItem('FAKTUR');
        setLoading(true);
        try {
            let requestBody = {
                FAKTUR: FAKTUR
            };
            const vaTable = await postData(apiEndPointGetDataEdit, requestBody);
            const json = vaTable.data;
            setRetur(json.data);
            const addRetur = json.data.rtnpembelianfaktur;
            let _data = [...addRetur];
            if (_data && Array.isArray(_data)) {
                // setAddRetur(addRetur);
                const funcCalculateArray = [];
                for (let i = 0; i < _data.length; i++) {
                    const data = _data[i];
                    const ketAsal = 'dataEdit';
                    const funcCalculate = await calculateUpdatedGrandTotalDisc(data, null, null, null, ketAsal);
                    funcCalculateArray.push(funcCalculate);
                }

                // Set addItem setelah semua perhitungan selesai
                setAddRetur(() => {
                    const updatedAddItem = _data.map((data, index) => {
                        const funcCalc = funcCalculateArray[index];
                        return {
                            KODE: data.KODE,
                            BARCODE: data.BARCODE,
                            NAMA: data.NAMA,
                            QTYPO: data.QTY,
                            TERIMABRG: data.TERIMABRG,
                            RETUR: data.RETUR,
                            SATUAN: data.SATUAN,
                            HARGABELI: data.HARGABELI,
                            HJ: data.HJ,
                            DISCOUNT: funcCalc.totDiscQty,
                            PPN: funcCalc.totPpnQty,
                            SUBTOTAL: funcCalc.subTotal,
                            GRANDTOTAL: funcCalc.updatedGrandTotalDisc
                        };
                    });
                    return updatedAddItem;
                });
            } else {
                setAddRetur([]);
            }
        } catch (error) {
            console.log('Error fetching data:', error);
            setLoading(false);
        } finally {
            setLoading(false);
        }
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
        let data = {
            FAKTUR: _retur.FAKTUR,
            FAKTURPEMBELIAN: '-',
            TGL: isUpdateMode ? _retur.TGL : formatDateSave(_retur.TGL),
            // JTHTMP: "",
            GUDANG: gudangKode || _retur.GUDANG,
            SUPPLIER: supplierKode || _retur.SUPPLIER,
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
                        return {
                            KODE: item.KODE,
                            BARCODE: item.BARCODE,
                            HARGA: item.HARGABELI,
                            // HJ: item.HJ,
                            QTY: item.RETUR,
                            SATUAN: item.SATUAN,
                            DISCOUNT: item.DISCOUNT,
                            PPN: item.PPN,
                            JUMLAH: item.GRANDTOTAL
                        };
                    } else {
                        return null; // Jika retur <= 0, maka null digunakan sebagai placeholder
                    }
                })
                .filter((item) => item !== null) // Menghapus objek yang bernilai null
        };
        convertUndefinedToNull(data);
        return data;
    };

    const saveData = async (e) => {
        e.preventDefault();
        let _retur = { ...retur };
        let _addRetur = [...addRetur];
        let _data = createDataObject(_retur, _addRetur);
        if (_data.SUPPLIER == null) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Supplier Masih Kosong!', life: 3000 });
            return;
        }

        if (_data.GUDANG == null) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Gudang Masih Kosong!', life: 3000 });
            return;
        }

        if (_data.tabelTransaksiRtnPembelianFaktur.length === 0) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Belum Ada Barang yang diretur!', life: 3000 });
            return;
        }
        try {
            let endPoint;
            if (isUpdateMode) {
                endPoint = apiEndPointUpdate;
            } else {
                endPoint = apiEndPointStore;
            }
            const vaTable = await postData(endPoint, _data);
            const json = vaTable.data;
            showSuccess(toast, json?.message)
            setTimeout(() => {
                router.push('/pembelian/retur');
            }, 2000);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    // -----------------------------------------------------------------------------------------------------------------< FakturPembelian >
    const deleteSelectedRow = (rowData) => {
        const updatedAddRetur = addRetur.filter((row) => row.KODE !== rowData.KODE);
        setAddRetur(updatedAddRetur);
    };

    // -----------------------------------------------------------------------------------------------------------------< Supplier >
    const [supplierDialog, setSupplierDialog] = useState(false);
    const [supplierKode, setSupplierKode] = useState('');
    const [supplierNama, setSupplierNama] = useState('');
    const [supplierAlamat, setSupplierAlamat] = useState('');
    const btnSupplier = () => {
        setSupplierDialog(true);
    };
    const handleSupplierData = (supplierKode, supplierNama, supplierAlamat) => {
        setSupplierKode(supplierKode);
        setSupplierNama(supplierNama);
        setSupplierAlamat(supplierAlamat);
    };

    // -----------------------------------------------------------------------------------------------------------------< Gudang >
    const [gudangDialog, setGudangDialog] = useState(false);
    const [gudangKode, setGudangKode] = useState('');
    const [gudangKet, setGudangKet] = useState('');
    const btnGudang = () => {
        setGudangDialog(true);
    };
    const handleGudangData = (gudangKode, gudangKet) => {
        setGudangKode(gudangKode);
        setGudangKet(gudangKet);
        setRetur((prevRetur) => ({
            ...prevRetur,
            GUDANG: gudangKode
        }));
    };

    // -----------------------------------------------------------------------------------------------------------------< PRODUK / BARCODE >
    const [produkDialog, setProdukDialog] = useState(false);
    const [produkFaktur, setProdukFaktur] = useState('');
    const btnProduk = () => {
        setProdukDialog(true);
    };
    const handleProdukData = (dataProduk) => {
        onRowSelectBarcode({ data: dataProduk });
    };
    // ---------------------------------------------------------------------------------------------< Search Barcode by inputan (enter) >
    const [timer, setTimer] = useState(null);
    const handleBarcodeKeyDown = async (event) => {
        clearTimeout(timer);
        const newTimer = setTimeout(async () => {
            if (event.key === 'Enter') {
                const barcodeInput = document.getElementById('barcode');
                const enteredBarcode = barcodeInput.value;

                if (enteredBarcode.trim() === '') {
                    return;
                }
                // Periksa apakah barcode yang dimasukkan mencakup kuantitas
                const barcodeDanQty = enteredBarcode.split('*');
                let enteredQty = 1;
                let enteredBarcodeValue = enteredBarcode;

                if (barcodeDanQty.length === 2) {
                    enteredQty = parseFloat(barcodeDanQty[0]);
                    enteredBarcodeValue = barcodeDanQty[1];
                }

                const params = { data: { KODE_TOKO: enteredBarcodeValue }, skipSelectBarcode: true, qty: enteredQty };
                await onRowSelectBarcode(params);

                barcodeInput.value = '';
            }
        }, 100);
        setTimer(newTimer);
    };

    const onRowSelectBarcode = async (event) => {
        const selectedKode = event.data.KODE_TOKO;
        const enteredQty = event.qty || 1;
        // --- API
        try {
            const vaTable = await postData(apiEndPointGetBarcode, { Barcode: `%${selectedKode}%` });
            const json = vaTable.data.data;
            const valBarcode = json[0].BARCODE;
            const existingIndex = addRetur.findIndex((item) => item.BARCODE === valBarcode);
            const qtyToAdd = json.TERIMA || enteredQty || 1;
            //  --- Cek ada data yang sama di Tabel addRetur
            if (existingIndex !== -1) {
                // -------------------------------------------------------------- sudah ada di addRetur
                setAddRetur((prevAddRetur) => {
                    const ketAsal = 'existInTable';
                    const updatedAddRetur = [...prevAddRetur];
                    const addedData = updatedAddRetur[existingIndex];
                    const updatedQTY = addedData.TERIMA + qtyToAdd;
                    const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, qtyToAdd, undefined, undefined, ketAsal);
                    const updatedGrandTotalDisc = funcCalculate.updatedGrandTotalDisc;
                    const hargaDisc = funcCalculate.hargaDisc;
                    const hargaPpn = funcCalculate.hargaPpn;
                    const subTotal = funcCalculate.subTotal;
                    const totDiscQty = funcCalculate.totDiscQty;
                    const totPpnQty = funcCalculate.totPpnQty;
                    updatedAddRetur[existingIndex] = {
                        ...addedData,
                        RETUR: updatedQTY,
                        SUBTOTAL: subTotal,
                        GRANDTOTAL: updatedGrandTotalDisc,
                        DISCOUNT: totDiscQty,
                        PPN: totPpnQty
                    };
                    return updatedAddRetur;
                });
            } else {
                // -------------------------------------------------------------- BELUM ada di addRetur
                const addedData = json[0];
                const ketAsal = 'firstEnter';
                const jsonWithDefaultQty = json.map((item) => ({ ...item, TERIMA: qtyToAdd }));
                const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, qtyToAdd, undefined, undefined, ketAsal);
                const updatedGrandTotalDisc = funcCalculate.updatedGrandTotalDisc;
                const hargaDisc = funcCalculate.hargaDisc;
                const hargaPpn = funcCalculate.hargaPpn;
                const subTotal = funcCalculate.subTotal;
                const totDiscQty = funcCalculate.totDiscQty;
                const totPpnQty = funcCalculate.totPpnQty;
                setAddRetur((prevAddRetur) => [...prevAddRetur, { ...addedData, RETUR: qtyToAdd, SUBTOTAL: subTotal, GRANDTOTAL: updatedGrandTotalDisc, DISCOUNT: totDiscQty, PPN: totPpnQty }]);
            }
            const newDataRow = document.getElementById('new-data-row'); // Ganti dengan ID atau ref dari elemen yang menampilkan data baru dimasukkan
            if (newDataRow) {
                newDataRow.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Menggulirkan elemen baru ke tengah layar jika perlu
            }
            setProdukDialog(false);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setProdukDialog(false);
        }
    };
    //------------------------------------------------------------------------------------------------------- ---------Edit In Row
    const isPositiveInteger = (value) => {
        const parsedValue = parseInt(value, 10);
        return Number.isInteger(parsedValue) && parsedValue > 0;
    };

    const onQtyUpdate = (updatedAddRetur) => {
        setAddRetur(updatedAddRetur);
    };
    const onCellEditComplete = (e) => {
        let { rowData, newValue, field, originalEvent: event } = e;
        switch (field) {
            // Kondisi edit field RETUR, melakukan perhitungan RETUR * HARGABELI
            case 'RETUR':
                const editedQtyRetur = parseFloat(newValue);
                if (!isNaN(editedQtyRetur)) {
                    // Check if editedQty is a valid number
                    if (editedQtyRetur === 0 || editedQtyRetur === '') {
                        deleteSelectedRow(rowData);
                    }
                }
                if (isPositiveInteger(newValue) || newValue === '0') {
                    const existingIndex = addRetur.findIndex((item) => item.BARCODE === rowData.BARCODE);
                    // const updatedAddRetur = [...addRetur];
                    const updatedAddRetur = addRetur.map((item) => {
                        if (item.BARCODE === rowData.BARCODE) {
                            const addedData = rowData;
                            const terima = rowData.TERIMABRG;
                            const initialQty = addedData.RETUR;
                            const ketAsal = 'editQTYReturFromTable';

                            const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, null, editedQtyRetur, undefined, ketAsal, null, null, null);
                            const updatedGrandTotalDisc = funcCalculate.updatedGrandTotalDisc;
                            const subTotal = funcCalculate.subTotal;
                            const totDiscQty = funcCalculate.totDiscQty;
                            const totPpnQty = funcCalculate.totPpnQty;

                            // if (editedQtyRetur <= terima) {
                            return { ...item, RETUR: editedQtyRetur, SUBTOTAL: subTotal, GRANDTOTAL: updatedGrandTotalDisc, DISCOUNT: totDiscQty, PPN: totPpnQty };
                            // }
                        } else {
                            return item;
                        }
                    });
                    setAddRetur(updatedAddRetur);
                    // Call a function in index.js to handle the updated addRetur
                    if (onQtyUpdate) {
                        onQtyUpdate(updatedAddRetur);
                    }
                } else {
                    event.preventDefault();
                    console.log('Invalid input. Please enter a valid number for QTY.');
                }
                break;
            case 'HARGABELI':
                if (isPositiveInteger(newValue)) {
                    const editHargaBeli = parseFloat(newValue);
                    const updatedAddRetur = addRetur.map((item) => {
                        if (item.BARCODE === rowData.BARCODE) {
                            const addedData = rowData;
                            const qtyToAdd = addedData.QTY;
                            const ketAsal = 'editHargaBeliFromTable';

                            const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, null, undefined, null, ketAsal, editHargaBeli, null, null);
                            const updatedGrandTotalDisc = funcCalculate.updatedGrandTotalDisc;
                            const hargaDisc = funcCalculate.hargaDisc;
                            const subTotal = funcCalculate.subTotal;
                            const totDiscQty = funcCalculate.totDiscQty;
                            const totPpnQty = funcCalculate.totPpnQty;

                            return { ...item, HARGABELI: editHargaBeli, SUBTOTAL: subTotal, GRANDTOTAL: updatedGrandTotalDisc, DISCOUNT: totDiscQty, PPN: totPpnQty };
                        } else {
                            return item;
                        }
                    });
                    setAddRetur(updatedAddRetur);

                    // Call a function in index.js to handle the updated addRetur
                    if (onQtyUpdate) {
                        onQtyUpdate(updatedAddRetur);
                    }
                } else {
                    event.preventDefault();
                }
                break;

            case 'DISCOUNT':
                if (isPositiveInteger(newValue) || newValue === '0') {
                    const editDiscount = parseFloat(newValue);
                    const updatedAddRetur = addRetur.map((item) => {
                        if (item.BARCODE === rowData.BARCODE) {
                            const addedData = rowData;
                            const qtyToAdd = addedData.RETUR;
                            const ketAsal = 'editDiscountFromTable';

                            const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, qtyToAdd, undefined, null, ketAsal, null, editDiscount, null);
                            const updatedGrandTotalDisc = funcCalculate.updatedGrandTotalDisc;
                            const hargaDisc = funcCalculate.hargaDisc;
                            const subTotal = funcCalculate.subTotal;
                            const totDiscQty = funcCalculate.totDiscQty;
                            const totPpnQty = funcCalculate.totPpnQty;

                            return { ...item, SUBTOTAL: subTotal, GRANDTOTAL: updatedGrandTotalDisc, DISCOUNT: editDiscount, PPN: totPpnQty };
                        } else {
                            return item;
                        }
                    });
                    setAddRetur(updatedAddRetur);

                    // Call a function in index.js to handle the updated addRetur
                    if (onQtyUpdate) {
                        onQtyUpdate(updatedAddRetur);
                    }
                } else {
                    return item;
                }
                break;
            case 'PPN':
                if (isPositiveInteger(newValue) || newValue === '0') {
                    const editPpn = parseFloat(newValue);
                    const updatedAddRetur = addRetur.map((item) => {
                        if (item.BARCODE === rowData.BARCODE) {
                            const addedData = rowData;
                            const qtyToAdd = addedData.RETUR;
                            const ketAsal = 'editPpnFromTable';

                            const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, qtyToAdd, undefined, null, ketAsal, null, null, editPpn);
                            const updatedGrandTotalDisc = funcCalculate.updatedGrandTotalDisc;
                            const hargaDisc = funcCalculate.hargaDisc;
                            const subTotal = funcCalculate.subTotal;
                            const totDiscQty = funcCalculate.totDiscQty;
                            const totPpnQty = funcCalculate.totPpnQty;

                            return { ...item, SUBTOTAL: subTotal, GRANDTOTAL: updatedGrandTotalDisc, DISCOUNT: totDiscQty, PPN: editPpn };
                        } else {
                            return item;
                        }
                    });
                    setAddRetur(updatedAddRetur);

                    // Call a function in index.js to handle the updated addRetur
                    if (onQtyUpdate) {
                        onQtyUpdate(updatedAddRetur);
                    }
                } else {
                    return item;
                }
                break;
            default:
                if (newValue.trim().length > 0) rowData[field] = newValue;
                else event.preventDefault();
                break;
        }
    };

    const calculateUpdatedGrandTotalDisc = (addedData, qtyToAdd, editedQtyRetur, editedDisc, ketAsal, editHargaBeli, editNominalDisc, editNominalPpn) => {
        let updatedQTY;
        let disc;
        let ppn;
        let hargaDisc;
        let totDiscQty;
        let totPpnQty;
        let hargaBeli;
        let hargaPpn;
        if (ketAsal == 'firstEnter') {
            // -------------------------------------> 1
            updatedQTY = qtyToAdd;
            totDiscQty = addedData.DISCOUNT;
            totPpnQty = addedData.PAJAK;
            hargaBeli = addedData.HARGABELI;
        } else if (ketAsal == 'firstBonus') {
            // -------------------------------------> Bonus 1 dg Barcode yang sama dg dari faktur
            updatedQTY = qtyToAdd;
            totDiscQty = addedData.DISCOUNT;
            totPpnQty = addedData.PPN;
            hargaBeli = addedData.HARGABELI;
        } else if (ketAsal == 'existInTable') {
            // -------------------------------------> QTY di Tabel + 1 (exist sebelumnya)

            updatedQTY = addedData.QTY + qtyToAdd;
            totDiscQty = addedData.DISCOUNT;
            totPpnQty = addedData.PPN;
            hargaBeli = addedData.HARGABELI;
        } else if (ketAsal == 'editQTYReturFromTable') {
            // -------------------------------------> QTY sesuai edit in cell

            updatedQTY = editedQtyRetur;
            totDiscQty = addedData.DISCOUNT;
            totPpnQty = addedData.PPN;
            hargaBeli = addedData.HARGABELI;
        } else if (ketAsal == 'editHargaBeliFromTable') {
            // -------------------------------------> HB sesuai edit in cell
            updatedQTY = addedData.RETUR;
            totDiscQty = addedData.DISCOUNT;
            totPpnQty = addedData.PPN;
            hargaBeli = editHargaBeli;
        } else if (ketAsal == 'editDiscountFromTable') {
            // -------------------------------------> Disc di tabel - editDiscFromTable

            updatedQTY = addedData.RETUR;
            totDiscQty = editNominalDisc;
            totPpnQty = addedData.PPN;
            hargaBeli = addedData.HARGABELI;
        } else if (ketAsal == 'editPpnFromTable') {
            // -------------------------------------> Ppn di tabel - editPpnFromTable

            updatedQTY = addedData.RETUR;
            totDiscQty = addedData.DISCOUNT;
            totPpnQty = editNominalPpn;
            hargaBeli = addedData.HARGABELI;
        } else if (ketAsal == 'dataEdit') {
            // -------------------------------------> Dari FakturPo
            updatedQTY = addedData.RETUR;
            totDiscQty = addedData.DISCOUNT;
            totPpnQty = addedData.PPN;
            hargaBeli = addedData.HARGABELI;
        } else {
            // -------------------------------------> Dari FakturPo dataFakturPo
            updatedQTY = addedData.QTYPO;
            totDiscQty = addedData.DISCOUNT;
            totPpnQty = addedData.PPN;
            hargaBeli = addedData.HARGABELI;
        }
        // return;
        const subTotal = updatedQTY * hargaBeli; // -------< Total SEBELUM Disc >
        const hbAfterDisc = hargaBeli - hargaDisc; // -------< HARGABELIBELI setelah Disc (dikurangi hargaDisc) per barang >
        // const hargaPpn = hargaBeli * ppn;

        const grandTotal = editedDisc === 0 ? hargaBeli : hbAfterDisc; // ---------------< GRAND SUBTOTAL pake DISCOUNT>
        // const updatedGrandTotalDisc = updatedQTY * grandTotal;

        // const totPpnQty = hargaPpn * updatedQTY;
        const updatedGrandTotalDisc = subTotal - parseFloat(totDiscQty) + parseFloat(totPpnQty);
        return { updatedGrandTotalDisc, hargaDisc, subTotal, disc, updatedQTY, hargaPpn, ppn, totDiscQty, totPpnQty, hargaBeli };
    };
    //------------------------------------------------------------------------------------------------------------------CALCULATE
    const cellEditor = (options) => {
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
                            router.push('/pembelian/retur');
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

    const totQty = addRetur.reduce((accumulator, item) => {
        const returValue = parseFloat(item.QTYPO);
        return isNaN(returValue) ? accumulator : accumulator + returValue;
    }, 0);
    const totTerima = addRetur.reduce((accumulator, item) => {
        const returValue = parseFloat(item.TERIMABRG);
        return isNaN(returValue) ? accumulator : accumulator + returValue;
    }, 0);
    // const totTerima = addRetur.reduce((accumulator, item) => accumulator + parseFloat(item.TERIMABRG), 0);
    const totRetur = addRetur.reduce((accumulator, item) => {
        const returValue = parseFloat(item.RETUR);
        return isNaN(returValue) ? accumulator : accumulator + returValue;
    }, 0);
    const totHarga = addRetur.reduce((accumulator, item) => {
        const hargaValue = parseFloat(item.HARGABELI);
        return isNaN(hargaValue) ? accumulator : accumulator + hargaValue;
    }, 0);
    const totTotal = addRetur.reduce((accumulator, item) => {
        const totalValue = parseInt(item.SUBTOTAL);
        return isNaN(totalValue) ? accumulator : accumulator + totalValue;
    }, 0);
    const totDisc = addRetur.reduce((accumulator, item) => {
        const discValue = parseFloat(item.DISCOUNT);
        return isNaN(discValue) ? accumulator : accumulator + discValue;
    }, 0);
    const totalDiscount = isNaN(totDisc) || totDisc === undefined ? 0 : totDisc;
    const totPpn = addRetur.reduce((accumulator, item) => {
        const ppnValue = parseFloat(item.PPN);
        return isNaN(ppnValue) ? accumulator : accumulator + ppnValue;
    }, 0);
    const totalPpn = isNaN(totPpn) || totPpn === undefined ? 0 : totPpn;
    const totJumlah = addRetur.reduce((accumulator, item) => {
        const jumlahValue = parseFloat(item.GRANDTOTAL);
        return isNaN(jumlahValue) ? accumulator : accumulator + jumlahValue;
    }, 0);
    const totalJumlah = isNaN(totJumlah) || totJumlah === undefined ? 0 : totJumlah;

    let footerGroup = (
        <ColumnGroup>
            <Row>
                <Column headerStyle={{ textAlign: 'center' }} footer="Total:" colSpan={3} footerStyle={{ textAlign: 'right' }} />
                {/* <Column headerStyle={{ textAlign: "center" }} footer="Data" /> */}
                {/* <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={totQty.toString()} footerStyle={{ textAlign: 'center' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={totTerima.toString()} footerStyle={{ textAlign: 'center' }} /> */}
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={totRetur.toString()} footerStyle={{ textAlign: 'center' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={2} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={(rowData) => totTotal.toLocaleString()} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={(rowData) => totalDiscount.toLocaleString()} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={(rowData) => totalPpn.toLocaleString()} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={(rowData) => totalJumlah.toLocaleString()} footerStyle={{ textAlign: 'right' }} />
            </Row>
        </ColumnGroup>
    );
    const dropdownValues = [
        { name: 'FAKTUR', label: 'FAKTUR' },
        { name: 'SUPPLIER', label: 'SUPPLIER' }
    ];
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
                <div className="card">
                    <h4>{isUpdateMode ? 'Edit' : 'Add'} Retur Pembelian Tanpa Faktur</h4>
                    <hr />
                    <Toast ref={toast} />
                    <div>
                        <div className="formgrid grid">
                            {/* <div className="field col-6 mb-2 lg:col-6">
                                <div className="formgrid grid"> */}
                            <div className="field col-6 mb-2 lg:col-6">
                                <label htmlFor="faktur">Faktur</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly value={isUpdateMode ? retur.FAKTUR : keteranganFaktur} />
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-6">
                                <label htmlFor="tanggal">Tanggal Faktur</label>
                                <div className="p-inputgroup">
                                    <Calendar id="tgl" value={retur.TGL && retur.TGL ? new Date(retur.TGL) : new Date()} onChange={(e) => onInputChange(e, 'TGL')} showIcon dateFormat="dd-mm-yy" />
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-12">
                                <label htmlFor="gudang">Gudang</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly id="gudang_kode" value={gudangKode || retur.GUDANG} />
                                    <Button icon="pi pi-search" className="p-button" onClick={btnGudang} disabled={readOnlyEdit} />
                                    <InputText readOnly id="ket-Gudang" value={gudangKet || retur.KETGUDANG} />
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-12">
                                <label htmlFor="keterangan">Keterangan</label>
                                <div className="p-inputgroup">
                                    <InputText value={retur.KETERANGAN} onChange={(e) => onInputChange(e, 'KETERANGAN')} required autoFocus className={classNames({ 'p-invalid': submitted && !retur.KETERANGAN })} />
                                </div>
                            </div>
                            {/* </div>
                            </div> */}
                            {/* <div className="field col-6 mb-2 lg:col-6">
                                <div className="formgrid grid"> */}
                            {/* <div className="field col-12 mb-2 lg:col-12">
                                        <label htmlFor="fakturasli">Faktur Asli</label>
                                        <div className="p-inputgroup">
                                            <InputText value={retur.FAKTURASLI} onChange={(e) => onInputChange(e, 'FAKTURASLI')} required autoFocus className={classNames({ 'p-invalid': submitted && !retur.FAKTURASLI })} />
                                        </div>
                                    </div> */}
                            <div className="field col-6 mb-2 lg:col-12">
                                <label htmlFor="supplier">Supplier</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly id="supplier_kode" value={supplierKode || retur.SUPPLIER} />
                                    <Button icon="pi pi-search" className="p-button" onClick={btnSupplier} disabled={readOnlyEdit} />
                                    <InputText readOnly id="ket-Supplier" value={supplierNama || retur.NAMA} />
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-12">
                                <label htmlFor="kota">Alamat</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly value={supplierAlamat || retur.ALAMAT} />
                                </div>
                            </div>
                            <div className="field col-12 mb-2 lg:col-12">
                                <label htmlFor="supplier">Barcode</label>
                                <div className="p-inputgroup">
                                    <InputText id="barcode" onKeyDown={handleBarcodeKeyDown} />
                                    <Button icon="pi pi-search" className="p-button" onClick={btnProduk} />
                                </div>
                            </div>
                            {/* </div>
                            </div> */}
                        </div>
                    </div>
                    {/* <div className="my-2 text-right">
                        <Button label="Add" className="p-button-primary p-button-sm mr-2" onClick={openStokBaru} />
                    </div><hr></hr> */}
                    <div className={styles.datatableContainer}>
                        <DataTable
                            value={addRetur}
                            lazy
                            dataKey="KODE"
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
                            <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="BARCODE" header="BARCODE"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA"></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="RETUR"
                                header="RETUR"
                                editor={(options) => cellEditor(options)}
                                onCellEditComplete={onCellEditComplete}
                                body={(rowData) => {
                                    const value = rowData.RETUR ? parseInt(rowData.RETUR).toLocaleString() : '0';
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'center' }}
                            ></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="SATUAN" header="SATUAN"></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="HARGABELI"
                                header="HARGABELI"
                                body={(rowData) => {
                                    const value = rowData.HARGABELI ? parseInt(rowData.HARGABELI).toLocaleString() : 0;
                                    return value;
                                }}
                                editor={(options) => cellEditor(options)}
                                onCellEditComplete={onCellEditComplete}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="SUBTOTAL"
                                header="SUBTOTAL"
                                body={(rowData) => {
                                    const value = rowData.SUBTOTAL ? parseInt(rowData.SUBTOTAL).toLocaleString() : 0;
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="DISCOUNT"
                                header="DISCOUNT"
                                editor={(options) => textEditor(options)}
                                onCellEditComplete={onCellEditComplete}
                                body={(rowData) => {
                                    const value = rowData.DISCOUNT ? parseInt(rowData.DISCOUNT).toLocaleString() : 0;
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="PPN"
                                header="PPN"
                                editor={(options) => textEditor(options)}
                                onCellEditComplete={onCellEditComplete}
                                body={(rowData) => {
                                    const value = rowData.PPN ? parseInt(rowData.PPN).toLocaleString() : 0;
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="GRANDTOTAL"
                                header="GRANDTOTAL"
                                body={(rowData) => {
                                    const value = rowData.GRANDTOTAL ? parseInt(rowData.GRANDTOTAL).toLocaleString() : 0;
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                        </DataTable>
                    </div>
                    <br></br>
                    <Toolbar className="mb-4" right={rightFooterTemplate}></Toolbar>
                    <Supplier supplierDialog={supplierDialog} setSupplierDialog={setSupplierDialog} btnSupplier={btnSupplier} handleSupplierData={handleSupplierData} />
                    <Gudang gudangDialog={gudangDialog} setGudangDialog={setGudangDialog} btnGudang={btnGudang} handleGudangData={handleGudangData} />
                    <Produk produkDialog={produkDialog} setProdukDialog={setProdukDialog} btnProduk={btnProduk} handleProdukData={handleProdukData} />
                </div>
            </div>
        </div>
    );
}

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
import { convertToISODate, convertUndefinedToNull, formatDate, formatDateSave, formatRibuan, getDBConfig, getEmail, getFaktur, getGudang, getKeterangan, isPositiveInteger, showError, showSuccess } from '../../../component/GeneralFunction/GeneralFunction';
import styles from '../../../component/styles/dataTable.module.css';
import FakturPembelian from '../../component/fakturPembelian';
import postData from '../../../lib/Axios';
import { getSessionServerSide } from '../../../utilities/servertool';
import Supplier from '../../component/supplier';
import Produk from '../../component/produk';
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
    const apiEndPointGetDataByFakturPembelian = '/api/rtnpembelian_faktur/getdata_faktur';
    const apiEndPointStore = '/api/rtnpembelian_faktur/store';
    const apiEndPointGetDataEdit = '/api/rtnpembelian_faktur/getdata_edit';
    const apiEndPointUpdate = '/api/rtnpembelian_faktur/update';
    const apiEndPointGetBarcode = '/api/produk/get-barcode';
    const router = useRouter();
    const { status, jenis } = router.query;
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [retur, setRetur] = useState([]);
    const [supplierDialog, setSupplierDialog] = useState(false);
    const [addRetur, setAddRetur] = useState([]);
    const formattedJenis = jenis === 'denganpembelian' ? 'Dengan Pembelian ' : 'Tanpa Pembelian';
    const formattedStatus = status === 'create' ? 'Tambah ' : 'Ubah ';
    const [produkDialog, setProdukDialog] = useState(false);
    const [readOnlyEdit, setReadOnlyEdit] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [fakturPembelianDialog, setFakturPembelianDialog] = useState(false);
    const [fakturPembelianFaktur, setFakturPembelianFaktur] = useState('');
    const [timer, setTimer] = useState(null);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const onPage = (event) => {
        setlazyState(event);
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                let updates = {};
                if (status === 'update') {
                    await fetchDataForEdit();
                    setReadOnlyEdit(true);
                    setIsUpdateMode(true);
                } else {
                    const email = await getEmail();
                    const GUDANG = await getGudang(email);
                    const KETGUDANG = await getKeterangan(GUDANG, 'Keterangan', 'gudang');
                    const FAKTUR = await getFaktur('RB', 6);
                    updates = { FAKTUR, GUDANG, KETGUDANG };
                    setIsUpdateMode(false);
                }
                setRetur(prev => ({
                    ...prev,
                    ...updates
                }));
            } catch (error) {
                const e = error?.response?.data || error;
                showError(toast, e?.message || 'Terjadi Kesalahan');
            }
        };
        fetchInitialData();
    }, [router.query]);

    // Yang Handle Perubahan Input Text
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _data = { ...retur };
        _data[`${name}`] = val;
        setRetur(_data);
    };

    // Yang Handle Edit
    const fetchDataForEdit = async () => {
        const FAKTUR = localStorage.getItem('FAKTUR');
        setLoading(true);
        try {
            let requestBody = {
                FAKTUR: FAKTUR
            };
            const vaTable = await postData(apiEndPointGetDataEdit, requestBody);
            const json = vaTable.data.data;
            setRetur(json);
            const addRetur = json.detail;
            let _data = [...addRetur];
            if (_data && Array.isArray(_data)) {
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
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    // Yang Handle Save
    const createDataObject = (_retur, _addRetur) => {
        let data = {
            FAKTUR: _retur.FAKTUR,
            FAKTURPEMBELIAN: fakturPembelianFaktur || _retur.FAKTURTERIMA,
            TGL: isUpdateMode ? _retur.TGL : formatDateSave(_retur.TGL) || convertToISODate(new Date()),
            TGLDO: _retur.TGLDO || convertToISODate(new Date()),
            TGLPO: _retur.TGLPO || convertToISODate(new Date()),
            JTHTMP: _retur.JTHTMP || convertToISODate(new Date()),
            FAKTURASLI: _retur.FAKTURASLI,
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
                        return {
                            KODE: item.KODE,
                            BARCODE: item.BARCODE,
                            HARGA: item.HARGABELI,
                            RETUR: RETUR,
                            SATUAN: item.SATUAN,
                            DISCOUNT: item.DISCOUNT,
                            PPN: item.PPN,
                            JUMLAH: item.GRANDTOTAL
                        };
                    } else {
                        return null;
                    }
                })
                .filter((item) => item !== null)
        };
        convertUndefinedToNull(data);
        return data;
    };

    const saveData = async (e) => {
        e.preventDefault();
        let _retur = { ...retur };
        let _addRetur = [...addRetur];
        let _data = createDataObject(_retur, _addRetur);

        if (jenis == 'denganpembelian' && _data.FAKTURPEMBELIAN === null) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Faktur Pembelian Masih Kosong!', life: 3000 });
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
            router.push('/pembelian/retur');
            showSuccess(toast, json?.message)
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    // Yang Handle Faktur Pembelian
    const btnFakturPembelian = () => {
        setFakturPembelianDialog(true);
    };
    const handleFakturPembelianData = (fakturPembelianFaktur) => {
        onRowSelectFakturPembelian(fakturPembelianFaktur);
    };

    const onRowSelectFakturPembelian = async (fakturPembelianFaktur) => {
        let requestBody = {
            FAKTUR: fakturPembelianFaktur
        };
        try {
            setLoading(true);
            const vaTable = await postData(apiEndPointGetDataByFakturPembelian, requestBody);
            const json = vaTable.data.data;
            setRetur(prev => ({
                ...prev,
                ...json,
                FAKTUR: prev.FAKTUR, // jaga agar tidak tertimpa
                FAKTURTERIMA: json.FAKTUR
            }));

            const addRetur = json.detail;
            let _data = [...addRetur];
            if (_data && Array.isArray(_data)) {
                // setAddRetur(addRetur);
                const funcCalculateArray = [];
                for (let i = 0; i < _data.length; i++) {
                    const data = _data[i];
                    const ketAsal = 'dataFakturPembelian';
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
                            QTYPO: data.QTYPO,
                            TERIMABRG: data.TERIMABRG,
                            RETUR: data.RETUR,
                            SATUAN: data.SATUAN,
                            HARGABELI: data.HARGABELI,
                            HJ: data.HJ,
                            DISCOUNT: funcCalc.totDiscQty,
                            PPN: funcCalc.totPpnQty,
                            SUBTOTAL: funcCalc.subTotal,
                            GRANDTOTAL: funcCalc.updatedGrandTotalDisc,
                            ketAsal: 'dataFakturPembelian'
                        };
                    });
                    return updatedAddItem;
                });
            } else {
                setAddRetur([]);
            }
        } catch (error) {
            console.error('Error while loading data:', error);
            setLoading(false);
        } finally {
            setLoading(false);
        }

        setFakturPembelianDialog(false);
    };

    // Yang Handle Hapus Delete Per Item
    const deleteSelectedRow = (rowData) => {
        const updatedAddRetur = addRetur.filter((row) => row.KODE !== rowData.KODE);
        setAddRetur(updatedAddRetur);
    };

    //    Yang Handle Perubahan Tabel
    const onQtyUpdate = (updatedAddRetur) => {
        setAddRetur(updatedAddRetur);
    };

    const onCellEditComplete = (e) => {
        const { rowData, newValue, field, originalEvent: event } = e;
        const parsedValue = parseFloat(newValue);
        const isValidNumber = !isNaN(parsedValue) && parsedValue >= 0;

        const updateAddRetur = (ketAsal) => {
            const updatedAddRetur = addRetur.map((item) => {
                if (item.BARCODE !== rowData.BARCODE) return item;
                if (field === 'RETUR' && parsedValue > item.TERIMABRG) {
                    showError(toast, 'Jumlah Retur Tidak Boleh Melebihi Terima');
                    return item;
                }
                if (field === 'RETUR') rowData.RETUR = parsedValue;
                if (field === 'HARGABELI') rowData.HARGABELI = parsedValue;
                if (field === 'DISCOUNT') rowData.DISCOUNT = parsedValue;
                if (field === 'PPN') rowData.PPN = parsedValue;

                const funcCalculate = calculateUpdatedGrandTotalDisc(
                    rowData,
                    field === 'RETUR' ? null : rowData.RETUR,
                    field === 'RETUR' ? parsedValue : undefined,
                    null,
                    ketAsal,
                    field === 'HARGABELI' ? parsedValue : null,
                    field === 'DISCOUNT' ? parsedValue : null,
                    field === 'PPN' ? parsedValue : null
                );

                return {
                    ...item,
                    RETUR: field === 'RETUR' ? parsedValue : item.RETUR,
                    HARGABELI: field === 'HARGABELI' ? parsedValue : item.HARGABELI,
                    DISCOUNT: funcCalculate.totDiscQty,
                    PPN: funcCalculate.totPpnQty,
                    SUBTOTAL: funcCalculate.subTotal,
                    GRANDTOTAL: funcCalculate.updatedGrandTotalDisc,
                };
            });

            setAddRetur(updatedAddRetur);
            if (onQtyUpdate) onQtyUpdate(updatedAddRetur);
        };

        switch (field) {
            case 'RETUR':
                if (!isValidNumber) return;

                if (parsedValue === 0) {
                    deleteSelectedRow(rowData);
                } else {
                    updateAddRetur('editQTYReturFromTable');
                }
                break;

            case 'HARGABELI':
            case 'DISCOUNT':
            case 'PPN':
                if (isValidNumber) {
                    updateAddRetur(`edit${capitalize(field)}FromTable`);
                } else {
                    event.preventDefault();
                }
                break;

            case 'PPNs':
                // Optional: jika ini kasus khusus yang tidak masuk ke calculateUpdatedGrandTotalDisc
                if (isValidNumber) {
                    const updatedAddRetur = addRetur.map((item) => {
                        if (item.BARCODE !== rowData.BARCODE) return item;

                        const SUBTOTAL = item.RETUR * item.HARGA;
                        const DISCOUNT = Math.round(SUBTOTAL * persdisc);
                        const GRANDTOTAL = SUBTOTAL - DISCOUNT + parsedValue;

                        return {
                            ...item,
                            PPN: parsedValue,
                            SUBTOTAL,
                            DISCOUNT,
                            GRANDTOTAL
                        };
                    });

                    setAddRetur(updatedAddRetur);
                    if (onQtyUpdate) onQtyUpdate(updatedAddRetur);
                } else {
                    event.preventDefault();
                }
                break;

            default:
                if (typeof newValue === 'string' && newValue.trim().length > 0) {
                    rowData[field] = newValue;
                } else {
                    event.preventDefault();
                }
                break;
        }
    };

    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

    const calculateUpdatedGrandTotalDisc = (
        addedData,
        qtyToAdd,
        editedQtyRetur,
        editedDisc,
        ketAsal,
        editHargaBeli,
        editNominalDisc,
        editNominalPpn
    ) => {
        let updatedQTY = addedData.RETUR ?? 0;
        let hargaBeli = addedData.HARGABELI ?? 0;
        let totDiscQty = addedData.DISCOUNT ?? 0; // nominal diskon (rupiah)
        let totPpnQty = addedData.PPN ?? 0;       // nominal ppn (rupiah)

        switch (ketAsal) {
            case 'firstEnter':
                updatedQTY = qtyToAdd;
                break;
            case 'existInTable':
                updatedQTY += qtyToAdd;
                break;
            case 'editQTYReturFromTable':
                updatedQTY = editedQtyRetur;
                break;
            case 'editHargaBeliFromTable':
                hargaBeli = editHargaBeli;
                break;
            case 'editDiscountFromTable':
                totDiscQty = editNominalDisc;
                break;
            case 'editPpnFromTable':
                totPpnQty = editNominalPpn;
                break;
        }

        const subTotal = updatedQTY * hargaBeli;
        const retur = addedData.RETUR || 1;
        const discPerItem = (addedData.DISCOUNT ?? 0) / retur;
        const ppnPerItem = (addedData.PPN ?? 0) / retur;
        if (ketAsal === 'editQTYReturFromTable' || ketAsal === 'firstEnter' || ketAsal === 'existInTable') {
            totDiscQty = discPerItem * updatedQTY;
            totPpnQty = ppnPerItem * updatedQTY;
        }

        const updatedGrandTotalDisc = subTotal - totDiscQty + totPpnQty;

        return {
            updatedGrandTotalDisc,
            hargaDisc: discPerItem, // diskon per item (untuk info saja)
            subTotal,
            discPerItem,
            ppnPerItem,
            updatedQTY,
            totDiscQty,
            totPpnQty,
            hargaBeli
        };
    };

    const cellEditor = (options) => {
        return textEditor(options);
    };

    const textEditor = (options) => {
        return <InputText type="text" value={options.value} onChange={(e) => options.editorCallback(e.target.value)} />;
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

    const totQty = addRetur.reduce((accumulator, item) => {
        const returValue = parseFloat(item.QTYPO);
        return isNaN(returValue) ? accumulator : accumulator + returValue;
    }, 0);
    const totTerima = addRetur.reduce((accumulator, item) => {
        const returValue = parseFloat(item.TERIMABRG);
        return isNaN(returValue) ? accumulator : accumulator + returValue;
    }, 0);
    const totRetur = addRetur.reduce((accumulator, item) => {
        const returValue = parseFloat(item.RETUR);
        return isNaN(returValue) ? accumulator : accumulator + returValue;
    }, 0);
    const totHarga = addRetur.reduce((accumulator, item) => {
        const hargaValue = parseFloat(item.HARGA);
        return isNaN(hargaValue) ? accumulator : accumulator + hargaValue;
    }, 0);
    const totTotal = addRetur.reduce((accumulator, item) => {
        const totalValue = parseInt(item.SUBTOTAL);
        return isNaN(totalValue) ? accumulator : accumulator + totalValue;
    }, 0);
    const totDisc = addRetur.reduce((accumulator, item) => {
        const discValue = parseInt(item.DISCOUNT);
        return isNaN(discValue) ? accumulator : accumulator + discValue;
    }, 0);
    const totalDiscount = isNaN(totDisc) || totDisc === undefined ? 0 : totDisc;
    const totPpn = addRetur.reduce((accumulator, item) => {
        const ppnValue = parseInt(item.PPN);
        return isNaN(ppnValue) ? accumulator : accumulator + ppnValue;
    }, 0);
    const totalPpn = isNaN(totPpn) || totPpn === undefined ? 0 : totPpn;
    const totJumlah = addRetur.reduce((accumulator, item) => {
        const jumlahValue = parseInt(item.GRANDTOTAL);
        return isNaN(jumlahValue) ? accumulator : accumulator + jumlahValue;
    }, 0);
    const totalJumlah = isNaN(totJumlah) || totJumlah === undefined ? 0 : totJumlah;

    let footerGroup = (
        <ColumnGroup>
            <Row>
                <Column footer="Total:" colSpan={3} footerStyle={{ textAlign: 'right' }} />
                {jenis === 'denganpembelian' && (
                    <Column colSpan={1} footer={totQty.toString()} />
                )}
                {jenis === 'denganpembelian' && (
                    <Column colSpan={1} footer={totTerima.toString()} />
                )}
                <Column colSpan={1} footer={totRetur.toString()} />
                <Column colSpan={2} />
                <Column colSpan={1} footer={(rowData) => totTotal.toLocaleString()} />
                <Column colSpan={1} footer={(rowData) => totalDiscount.toLocaleString()} />
                <Column colSpan={1} footer={(rowData) => totalPpn.toLocaleString()} />
                <Column colSpan={2} footer={(rowData) => totalJumlah.toLocaleString()} />
            </Row>
        </ColumnGroup>
    );

    // Yang Handle Supplier
    const btnSupplier = () => {
        setSupplierDialog(true);
    };

    const handleSupplierData = (supplierKode, supplierNama, supplierAlamat) => {
        setRetur((prevState) => ({
            ...prevState,
            SUPPLIER: supplierKode,
            NAMA: supplierNama,
            ALAMAT: supplierAlamat
        }));
    };

    // Yang Handle Produk
    const btnProduk = () => {
        setProdukDialog(true);
    };

    const handleProdukData = (produk) => {
        onRowSelectBarcode({ data: { KODE_TOKO: produk.KODE } });
    };

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

                const params = { data: { KODE_TOKO: enteredBarcodeValue, RETUR: enteredQty }, skipSelectBarcode: true };
                onRowSelectBarcode(params);


                barcodeInput.value = '';
            }
        }, 100);
        setTimer(newTimer);
    };

    const onRowSelectBarcode = async (event) => {
        const selectedKode = event.data?.KODE_TOKO;
        if (!selectedKode) {
            showError(toast, "Barang Tidak Ditemukan!");
            setProdukDialog(false);
            return;
        }
        const enteredQty = event.data?.RETUR || 1;


        try {
            const { data: { data: jsonData } } = await postData(apiEndPointGetBarcode, { Barcode: `%${selectedKode}%` });

            if (!jsonData || jsonData.status === 'BARANG TIDAK DITEMUKAN') {
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Barang Tidak Ditemukan', life: 3000 });
                setProdukDialog(false);
                return;
            }

            const [itemData] = jsonData;
            const existingIndex = addRetur.findIndex(item => item.BARCODE === itemData.BARCODE);
            const qtyToAdd = enteredQty || 1;

            setAddRetur(prev => {
                const updatedAddRetur = [...prev];
                const ketAsal = existingIndex !== -1 ? 'existInTable' : 'firstEnter';
                const existingData = existingIndex !== -1 ? updatedAddRetur[existingIndex] : itemData;
                const existingQty = existingData.RETUR || 0;
                const totalQty = existingQty + qtyToAdd;

                const {
                    updatedGrandTotalDisc,
                    subTotal,
                    totDiscQty,
                    totPpnQty
                } = calculateUpdatedGrandTotalDisc(existingData, totalQty, undefined, undefined, ketAsal);

                const updatedItem = {
                    ...existingData,
                    RETUR: totalQty,
                    SUBTOTAL: subTotal,
                    GRANDTOTAL: updatedGrandTotalDisc,
                    DISCOUNT: totDiscQty,
                    PPN: totPpnQty
                };

                if (existingIndex !== -1) {
                    updatedAddRetur[existingIndex] = updatedItem;
                } else {
                    updatedAddRetur.push(updatedItem);
                }

                return updatedAddRetur;
            });

            document.getElementById('new-data-row')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setProdukDialog(false);

        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setProdukDialog(false);
        }
    };

    const actionBodyTabel = (rowData) => {
        return (
            <>
                <Button icon="pi pi-trash" style={{ backgroundColor: '#ca656f', border: '1px solid #ca656f' }} className="p-button-danger p-button p-button-sm mr-2" onClick={() => deleteSelectedRow(rowData)} />
            </>
        );
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>{`${formattedStatus} Retur Pembelian Barang ${formattedJenis}`}</h4>
                    <hr />
                    <Toast ref={toast} />
                    <div>
                        <div className="formgrid grid">
                            <div className={`field col-6 mb-2 ${jenis === 'tanpapembelian' ? 'lg:col-6' : 'lg:col-4'}`}>
                                <label htmlFor="faktur">Faktur</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly value={retur.FAKTUR} />
                                </div>
                            </div>
                            {jenis !== 'tanpapembelian' && (
                                <div className="field col-6 mb-2 lg:col-4">
                                    <label htmlFor="faktur">Faktur Pembelian</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly value={retur.FAKTURTERIMA} placeholder="Pilih Faktur Terima" />
                                        <Button icon="pi pi-search" className="p-button" onClick={btnFakturPembelian} disabled={readOnlyEdit} />
                                    </div>
                                </div>
                            )}
                            {jenis !== 'tanpapembelian' && (
                                <div className="field col-6 mb-2 lg:col-4">
                                    <label htmlFor="fakturasli">Faktur Asli</label>
                                    <div className="p-inputgroup">
                                        <InputText value={retur.FAKTURASLI} onChange={(e) => onInputChange(e, 'FAKTURASLI')} required autoFocus />
                                    </div>
                                </div>
                            )}
                            <div className={`field col-6 mb-2 ${jenis === 'tanpapembelian' ? 'lg:col-6' : 'lg:col-3'}`}>
                                <label htmlFor="tanggal">Tanggal Faktur</label>
                                <div className="p-inputgroup">
                                    <Calendar id="tgl" value={retur.TGL && retur.TGL ? new Date(retur.TGL) : new Date()} onChange={(e) => onInputChange(e, 'TGL')} showIcon dateFormat="dd-mm-yy" />
                                </div>
                            </div>
                            {jenis !== 'tanpapembelian' && (
                                <div className="field col-6 mb-2 lg:col-3">
                                    <label htmlFor="tanggal">Tanggal PO</label> {/* dari TotPembelian */}
                                    <div className="p-inputgroup">
                                        <InputText readOnly id="tanggalpo" value={formatDate(retur.TGLPO || new Date())} onChange={(e) => onInputChange(e, 'TGLPO')} />
                                        <Button icon="pi pi-calendar" className="p-button" />
                                    </div>
                                </div>
                            )}
                            {jenis !== 'tanpapembelian' && (
                                <div className="field col-6 mb-2 lg:col-3">
                                    <label htmlFor="tanggalDO">Tanggal DO</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly id="tglDO" value={formatDate(retur.TGLDO || new Date())} onChange={(e) => onInputChange(e, 'TGLDO')} />
                                        <Button icon="pi pi-calendar" className="p-button" />
                                    </div>
                                </div>
                            )}
                            {jenis !== 'tanpapembelian' && (
                                <div className="field col-6 mb-2 lg:col-3">
                                    <label htmlFor="tanggal">Jatuh Tempo</label>
                                    <div className="p-inputgroup">
                                        <InputText id="jatuhtempo" value={formatDate(retur.JTHTMP || new Date())} onChange={(e) => onInputChange(e, 'JTHTMP')} readOnly />
                                        <Button icon="pi pi-calendar" className="p-button" />
                                    </div>
                                </div>
                            )}
                            <div className="field col-6 mb-2 lg:col-12">
                                <label htmlFor="gudang">Gudang</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly id="gudang_kode" value={retur.GUDANG} />
                                    <InputText readOnly id="ket-Gudang" value={retur.KETGUDANG} />
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-6">
                                <label htmlFor="supplier">Supplier</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly id="supplier_kode" value={retur.SUPPLIER} />
                                    {jenis === 'tanpapembelian' && (
                                        <Button icon="pi pi-search" className="p-button" onClick={btnSupplier} />
                                    )}
                                    <InputText readOnly id="ket-Supplier" value={retur.NAMA} />
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-6">
                                <label htmlFor="kota">Alamat</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly id="alamat-Supplier" value={retur.ALAMAT} />
                                </div>
                            </div>
                            <div className={`field col-6 mb-2 ${jenis === 'tanpapembelian' ? 'lg:col-6' : 'lg:col-12'}`}>
                                <label htmlFor="keterangan">Keterangan</label>
                                <div className="p-inputgroup">
                                    <InputText value={retur.KETERANGAN} onChange={(e) => onInputChange(e, 'KETERANGAN')} required autoFocus />
                                </div>
                            </div>
                            {jenis !== 'denganpembelian' && (
                                <div className="field col-6 mb-2 lg:col-6">
                                    <label htmlFor="barcode">Barcode</label>
                                    <div className="p-inputgroup">
                                        <InputText id="barcode" onKeyDown={handleBarcodeKeyDown} />
                                        <Button icon="pi pi-search" className="p-button" onClick={btnProduk} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={styles.datatableContainer}>
                        <DataTable
                            value={addRetur}
                            lazy
                            dataKey="KODE_TOKO"
                            rows={10}
                            className="datatable-responsive"
                            first={lazyState.first}
                            onPage={onPage}
                            loading={loading}
                            footerColumnGroup={footerGroup}
                            size="small"
                        >
                            <Column field="KODE" header="KODE"></Column>
                            <Column field="BARCODE" header="BARCODE"></Column>
                            <Column field="NAMA" header="NAMA"></Column>
                            {jenis === 'denganpembelian' && (
                                <Column
                                    field="QTYPO"
                                    header="QTY"
                                    body={(rowData) => {
                                        const value = rowData.QTYPO ? parseInt(rowData.QTYPO).toLocaleString() : '0';
                                        return value;
                                    }}
                                ></Column>
                            )}
                            {jenis === 'denganpembelian' && (
                                <Column
                                    field="TERIMABRG"
                                    header="TERIMA"
                                    body={(rowData) => {
                                        const value = rowData.TERIMABRG ? parseInt(rowData.TERIMABRG).toLocaleString() : '0';
                                        return value;
                                    }}
                                ></Column>
                            )}
                            <Column
                                field="RETUR"
                                header="RETUR"
                                editor={(options) => cellEditor(options)}
                                onCellEditComplete={onCellEditComplete}
                                body={(rowData) => {
                                    const value = rowData.RETUR ? parseInt(rowData.RETUR).toLocaleString() : '0';
                                    return value;
                                }}
                            ></Column>
                            <Column field="SATUAN" header="SATUAN"></Column>
                            <Column
                                field="HARGABELI"
                                header="HARGA"
                                body={(rowData) => {
                                    const value = rowData.HARGABELI ? parseInt(rowData.HARGABELI).toLocaleString() : 0;
                                    return value;
                                }}
                                editor={(options) => cellEditor(options)}
                                onCellEditComplete={onCellEditComplete}
                            ></Column>
                            <Column
                                field="SUBTOTAL"
                                header="SUBTOTAL"
                                body={(rowData) => {
                                    const value = rowData.SUBTOTAL ? parseInt(rowData.SUBTOTAL).toLocaleString() : 0;
                                    return value;
                                }}
                            ></Column>
                            <Column
                                field="DISCOUNT"
                                header="DISCOUNT"
                                editor={(options) => textEditor(options)}
                                onCellEditComplete={onCellEditComplete}
                                body={(rowData) => formatRibuan(rowData.DISCOUNT)}
                            ></Column>
                            <Column
                                field="PPN"
                                header="PPN"
                                // editor={(options) => textEditor(options)}
                                // onCellEditComplete={onCellEditComplete}
                                body={(rowData) => {
                                    const value = rowData.PPN ? parseInt(rowData.PPN).toLocaleString() : 0;
                                    return value;
                                }}
                            ></Column>
                            <Column
                                field="GRANDTOTAL"
                                header="GRANDTOTAL"
                                body={(rowData) => {
                                    const value = rowData.GRANDTOTAL ? parseInt(rowData.GRANDTOTAL).toLocaleString() : 0;
                                    return value;
                                }}
                            ></Column>
                            <Column header="ACTION" body={actionBodyTabel}></Column>
                        </DataTable>
                    </div>
                    <br></br>
                    <Toolbar className="mb-4" right={rightFooterTemplate}></Toolbar>
                    <FakturPembelian fakturPembelianDialog={fakturPembelianDialog} setFakturPembelianDialog={setFakturPembelianDialog} btnFakturPembelian={btnFakturPembelian} handleFakturPembelianData={handleFakturPembelianData} />
                </div>
            </div>
            <Supplier supplierDialog={supplierDialog} setSupplierDialog={setSupplierDialog} btnSupplier={btnSupplier} handleSupplierData={handleSupplierData} />
            <Produk produkDialog={produkDialog} setProdukDialog={setProdukDialog} btnProduk={btnProduk} handleProdukData={handleProdukData} />
        </div >
    );
}

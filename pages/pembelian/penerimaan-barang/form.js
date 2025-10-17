/**
     * Nama Program: GODONG POS - Pembelian - Penerimaan Barang
     * Pengembang: Salsabila Emma
     * Tanggal Pengembangan: 1 Maret 2024 (re-coding)
     * Versi: 1.1.0

    Catatan:
    - Versi 1.1.0 mencakup fungsionalitas Menu Penerimaan Barang
*/
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { RadioButton } from 'primereact/radiobutton';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { Calendar } from 'primereact/calendar';
import { useRouter } from 'next/router';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { formatDateSave, formatTglExpired, formatDate, formatRibuan, showError, showSuccess, convertToISODate, getDBConfig, convertUndefinedToNull, isPositiveInteger, getFaktur } from '../../../component/GeneralFunction/GeneralFunction';
import styles from '../../../component/styles/dataTable.module.css';
import Gudang from '../../component/gudang';
import FakturPo from '../../component/fakturPo';
import Produk from '../../component/produk';
import React, { useEffect, useRef, useState } from 'react';
import postData from '../../../lib/Axios';
import { getSessionServerSide } from '../../../utilities/servertool';
import Supplier from '../../component/supplier';
export const getServerSideProps = async (context) => {
    const sessionData = await getSessionServerSide(context, '/pembelian/penerimaan-barang');
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {
            _A2F: context?.req?.cookies['_A2F']
        }
    };
};
export default function FormPembelianPenerimaanBarang(props) {
    //hubungan dengan path api disini
    const apiEndPointGetBarcode = '/api/produk/get-barcode';
    const apiEndPointUpdate = '/api/pembelian/update';
    const apiEndPointStore = '/api/pembelian/store';
    const apiEndPointGetDataEdit = '/api/pembelian/getdata_edit';
    const router = useRouter();
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [pembelian, setPembelian] = useState({
        pembayaran: "K"
    });
    const [supplierDialog, setSupplierDialog] = useState(false);
    const { status, jenis } = router.query;
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [readOnlyEdit, setReadOnlyEdit] = useState(false);
    const [addPembelian, setAddPembelian] = useState([]);
    const [timer, setTimer] = useState(null);
    const [gudangDialog, setGudangDialog] = useState(false);
    const [fakturPoDialog, setFakturPoDialog] = useState(false);
    const [produkDialog, setProdukDialog] = useState(false);
    const formattedJenis = jenis === 'denganpo' ? 'Dengan Purchase Order ' : 'Tanpa Purchase Order';
    const formattedStatus = status === 'create' ? 'Tambah ' : 'Ubah ';
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                let updates = {};
                if (status === 'update') {
                    await fetchDataForEdit();
                    setReadOnlyEdit(true);
                    setIsUpdateMode(true);
                } else {
                    const [faktur, gudang, ketgudang] = await Promise.all([
                        getFaktur('PB', 6),
                        getDBConfig('gudang'),
                        getDBConfig('ketGudang')
                    ]);
                    updates = { faktur, gudang, ketgudang };
                    setIsUpdateMode(false);
                }
                setPembelian(prev => ({
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

    useEffect(() => {
        if (addPembelian && addPembelian.length > 0) {
            const totGrandTotal = addPembelian.reduce((acc, item) => {
                const returValue = parseFloat(item.grandtotal);
                return isNaN(returValue) ? acc : acc + returValue;
            }, 0);

            setPembelian(prev => {
                const pembulatanSebelumnya = prev.pembulatan ?? 0;
                const pembulatanManual = prev.pembulatanManual ?? false;
                let pembulatan = pembulatanSebelumnya;
                let grandTotal = totGrandTotal;

                if (!pembulatanManual) {
                    pembulatan = totGrandTotal % 100 === 0 ? 0 : 100 - (totGrandTotal % 100);
                    grandTotal = totGrandTotal + pembulatan;
                } else {
                    grandTotal = totGrandTotal + pembulatanSebelumnya;
                }

                return {
                    ...prev,
                    pembulatan: pembulatan,
                    grandTotal: grandTotal
                };
            });
        }
    }, [addPembelian]);

    // Yang Handle Input Number
    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        setPembelian(prev => {
            let updated = { ...prev, [name]: val };

            if (name === 'pembulatan') {
                // Kalau user input Pembulatan, flag pembulatanManual jadi true
                updated.pembulatanManual = true;

                const totGrandTotal = addPembelian.reduce((acc, item) => {
                    const returValue = parseFloat(item.grandtotal);
                    return isNaN(returValue) ? acc : acc + returValue;
                }, 0);

                updated.grandTotal = totGrandTotal + val;
            }

            return updated;
        });
    };

    // Yang Handle Radio Button
    const handleRadioChange = (e) => {
        let _produk = { ...pembelian };
        _produk['pembayaran'] = e.value;
        setPembelian(_produk);
    };

    // Yang Handle Input Text
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _data = { ...pembelian };
        _data[`${name}`] = val;
        setPembelian(_data);
    };

    // Yang Handle Save Data
    const createDataObject = (_pembelian, _addPembelian) => {
        const data = {
            faktur: _pembelian.faktur,
            po: _pembelian.po ?? '',
            fakturasli: _pembelian.fakturasli,
            tgl: isUpdateMode ? _pembelian.tgl : formatDateSave(_pembelian.tgl) || convertToISODate(new Date()),
            tglpo: _pembelian.tglpo || convertToISODate(new Date()),
            tgldo: _pembelian.tgldo || convertToISODate(new Date()),
            jthtmp: _pembelian.jthtmp || convertToISODate(new Date()),
            pembayaran: _pembelian.pembayaran,
            gudang: _pembelian.gudang,
            supplier: _pembelian.supplier,
            persdisc: _pembelian.persdisc,
            discount: totDisc,
            discount2: _pembelian.discount2 ?? 0,
            ppn: _pembelian.ppn,
            pajak: totPpn,
            subtotal: totSubTotal,
            total: pembelian.grandTotal,
            keterangan: _pembelian.keterangan,
            pembulatan: _pembelian.pembulatan,
            tabelTransaksiPembelian: _addPembelian
                .map((item) => {
                    const terima = item.terima !== null ? item.terima : 0;
                    if (terima > 0) {
                        const valTerimaBarang = item.terimabarang + item.terima;
                        convertUndefinedToNull(item);
                        return {
                            barcode: item.barcode,
                            kode: item.kode,
                            qtypo: item.qtypo,
                            terimabarang: valTerimaBarang || 0,
                            terima: item.terima || 0,
                            harga: item.hb,
                            hj: item.hj,
                            satuan: item.satuan,
                            discount: item.discount || 0,
                            discount2: 0,
                            ppn: item.ppn || 0,
                            jumlah: item.grandtotal,
                            tglexp: item.tglexp
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
        let _pembelian = { ...pembelian };
        let _addPembelian = [...addPembelian];
        let _data = createDataObject(_pembelian, _addPembelian);
        if (jenis === 'denganpo' && _data.po === null) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Faktur PO tidak boleh kosong', life: 3000 });
            return;
        }

        if (_data.gudang === null || _data.gudang === '') {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Gudang tidak boleh kosong', life: 3000 });
            return;
        }

        if (_data.pembayaran === null || _data.pembayaran === '') {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Pembayaran belum dipilih', life: 3000 });
            return;
        }

        if (_data.tabelTransaksiPembelian.length === 0) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tidak ada barang yang dibeli!', life: 3000 });
            return;
        }

        try {
            const endPoint = isUpdateMode ? apiEndPointUpdate : apiEndPointStore;
            const vaTable = await postData(endPoint, _data);
            const data = vaTable?.data;
            router.push('/pembelian/penerimaan-barang');
            showSuccess(toast, data?.message)
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    // Yang Handle Barcode
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

                const params = { data: { KODE_TOKO: enteredBarcodeValue, terima: enteredQty }, skipSelectBarcode: true };
                await (jenis === 'tanpapo' ? onRowSelectBarcodeTanpaPO(params) : onRowSelectBarcodeDenganPO(params));


                barcodeInput.value = '';
            }
        }, 100);
        setTimer(newTimer);
    };

    const calculateUpdatedGrandTotalDisc = (addedData, qtyToAdd, editedQty, editedDisc, ketAsal, editHargaBeli, editNominalDisc, editNominalPpn) => {
        let updatedQTY = addedData.terima;
        let hargaBeli = addedData.hb;
        let totDiscQty = addedData.discount || 0;
        let totPpnQty = addedData.ppn || 0;

        switch (ketAsal) {
            case 'firstEnter':
            case 'firstBonus':
            case 'dataEdit':
            default:
                updatedQTY = qtyToAdd ?? addedData.terima;
                break;
            case 'existInTable':
                updatedQTY = (addedData.QTY || 0) + (qtyToAdd || 0);
                break;
            case 'editQTYFromTable':
                updatedQTY = editedQty ?? addedData.terima;
                const { persdisc = 0, ppn = 0 } = pembelian || {};
                totDiscQty = updatedQTY * hargaBeli * (persdisc / 100);
                totPpnQty = updatedQTY * hargaBeli * (ppn / 100);
                break;
            case 'editHargaBeliFromTable':
                hargaBeli = editHargaBeli ?? addedData.hb;
                break;
            case 'editDiscountFromTable':
                totDiscQty = editNominalDisc ?? addedData.discount;
                break;
            case 'editPpnFromTable':
                totPpnQty = editNominalPpn ?? addedData.ppn;
                break;
        }

        const subtotal = updatedQTY * hargaBeli;
        const updatedGrandTotalDisc = subtotal - parseFloat(totDiscQty) + parseFloat(totPpnQty);

        const pembulatan1 = updatedGrandTotalDisc % 100;
        const pembulatan = pembulatan1 === 0 ? 0 : 100 - pembulatan1;

        return { updatedGrandTotalDisc, subtotal, updatedQTY, hargaBeli, totDiscQty, totPpnQty, pembulatan };
    };

    const onRowSelectBarcodeDenganPO = async (event) => {
        const selectedKode = event.data.KODE_TOKO;
        if (!selectedKode) {
            showError(toast, "Barang Tidak Ditemukan!");
            setProdukDialog(false);
            return;
        }
        try {
            const vaTable = await postData(apiEndPointGetBarcode, { Barcode: `%${selectedKode}%` });
            const json = vaTable.data.data;
            const valBarcode = json[0].BARCODE;
            const existingIndex = addPembelian.findIndex((item) => item.barcode === valBarcode);
            const qtyToAdd = event.data.terima || 1;
            const addedData = {
                bonus: true,
                kode: json[0].KODE,
                barcode: json[0].BARCODE,
                nama: json[0].NAMA,
                satuan: json[0].SATUAN,
                hb: json[0].HARGABELI,
                discount: json[0].DISCOUNT,
                ppn: json[0].PAJAK,
                hj: json[0].HJ,
                tglexp: json[0].TGLEXP
            };

            // Fungsi untuk menghitung data pembelian
            const calculatePembelianData = (data) => {
                // Jika barang adalah bonus, set nilai tertentu menjadi 0
                if (data.bonus) {
                    return {
                        ...data,
                        qtypo: 0,
                        terimabarang: 0,
                        grandtotal: 0,
                        subtotal: 0,
                        hb: 0, // Harga Beli di-set 0 untuk bonus
                        hj: 0  // Harga Jual di-set 0 untuk bonus
                    };
                }

                return {
                    ...data,
                    qtypo: 0,
                    terimabarang: 0,
                    grandtotal: 0,
                    subtotal: 0
                };
            };

            if (existingIndex !== -1) {
                // Jika sudah ada di tabel
                const updatedAddPembelian = [...addPembelian];

                // Mencari index item yang sesuai dengan barcode
                const array = updatedAddPembelian
                    .map((item, index) => (item.barcode === valBarcode ? index : null))
                    .filter((index) => index !== null);

                // Cek jika item bonus sudah ada di tabel dan tambahkan kuantitasnya
                if (updatedAddPembelian[updatedAddPembelian.length - 1]?.bonus) {
                    setAddPembelian((prevAddPembelian) => {
                        const updatedQty = updatedAddPembelian[array[array.length - 1]].terima + qtyToAdd;
                        updatedAddPembelian[array[array.length - 1]].terima = updatedQty;
                        return [...updatedAddPembelian];
                    });
                    return; // Menghentikan eksekusi lebih lanjut jika bonus sudah ada
                }

                // Menambahkan data baru ke tabel
                setAddPembelian((prevAddPembelian) => [
                    ...prevAddPembelian,
                    calculatePembelianData({ ...addedData, terima: qtyToAdd }),
                    ...json.slice(1).map((item) => ({ ...item, terima: qtyToAdd })),
                ]);
            } else {
                // Jika belum ada di tabel
                setAddPembelian((prevAddPembelian) => [
                    ...prevAddPembelian,
                    calculatePembelianData({ ...addedData, terima: qtyToAdd }),
                    ...json.slice(1).map((item) => ({ ...item, terima: qtyToAdd })),
                ]);
            }
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setProdukDialog(false);
        }
    };

    const onRowSelectBarcodeTanpaPO = async (event) => {
        const selectedKode = event.data.KODE_TOKO;
        if (!selectedKode) {
            showError(toast, 'Barang Tidak Ditemukan!')
            setProdukDialog(false);
            return;
        }
        try {
            const vaTable = await postData(apiEndPointGetBarcode, { Barcode: `%${selectedKode}%` });
            const json = vaTable.data.data;
            const valBarcode = json[0].BARCODE;
            const existingIndex = addPembelian.findIndex((item) => item.barcode === valBarcode);
            const qtyToAdd = event.data.terima || 1;
            const addedData = {
                kode: json[0].KODE,
                barcode: json[0].BARCODE,
                nama: json[0].NAMA,
                satuan: json[0].SATUAN,
                hb: json[0].HARGABELI,
                discount: json[0].DISCOUNT,
                ppn: json[0].PAJAK,
                hj: json[0].HJ,
                tglexp: json[0].TGLEXP
            };
            const calculatePembelianData = (data) => {
                let subtotal = data.terima * data.hb;
                let grandtotal = subtotal - data.discount + data.ppn;
                return {
                    ...data,
                    subtotal: subtotal,
                    grandtotal: grandtotal
                };
            };
            if (existingIndex !== -1) {
                // Jika sudah ada di tabel
                const updatedAddPembelian = [...addPembelian];

                // Mencari index item yang sesuai dengan barcode
                const array = updatedAddPembelian
                    .map((item, index) => (item.barcode === valBarcode ? index : null))
                    .filter((index) => index !== null);

                // Cek jika item bonus sudah ada di tabel dan tambahkan kuantitasnya
                if (updatedAddPembelian[updatedAddPembelian.length - 1]?.bonus) {
                    setAddPembelian((prevAddPembelian) => {
                        const updatedQty = updatedAddPembelian[array[array.length - 1]].terima + qtyToAdd;
                        updatedAddPembelian[array[array.length - 1]].terima = updatedQty;
                        return [...updatedAddPembelian];
                    });
                    return; // Menghentikan eksekusi lebih lanjut jika bonus sudah ada
                }

                // Menambahkan data baru ke tabel
                setAddPembelian((prevAddPembelian) => [
                    ...prevAddPembelian,
                    calculatePembelianData({ ...addedData, terima: qtyToAdd }),
                    ...json.slice(1).map((item) => ({ ...item, terima: qtyToAdd })),
                ]);
            } else {
                // Jika belum ada di tabel
                setAddPembelian((prevAddPembelian) => [
                    ...prevAddPembelian,
                    calculatePembelianData({ ...addedData, terima: qtyToAdd }),
                    ...json.slice(1).map((item) => ({ ...item, terima: qtyToAdd })),
                ]);
            }
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setProdukDialog(false);
        }
    };

    // Yang Handle Edit On Cell 
    const onQtyUpdate = (updatedAddPembelian) => {
        setAddPembelian(updatedAddPembelian);
    };

    const onCellEditComplete = (e) => {
        let { rowData, newValue, field, originalEvent: event } = e;
        const updatePembulatan = (updatedAddPembelian) => {
            const totalGrandTotal = updatedAddPembelian.reduce((acc, item) => acc + (item.grandtotal || 0), 0);
            const pembulatan2 = totalGrandTotal % 100;
            const pembulatan = pembulatan2 === 0 ? 0 : 100 - pembulatan2;
            const grandTotalSetelahPembulatan = totalGrandTotal + pembulatan;
            setPembelian(prev => ({
                ...prev,
                pembulatan: pembulatan,
                grandTotal: grandTotalSetelahPembulatan
            }));
        };

        const updateAndSetPembelian = (mapCallback) => {
            const updatedAddPembelian = addPembelian.map(mapCallback);
            setAddPembelian(updatedAddPembelian);
            updatePembulatan(updatedAddPembelian);
            if (onQtyUpdate) {
                onQtyUpdate(updatedAddPembelian);
            }
        };

        const updateItemField = (fieldName, value) => {
            const updatedAddPembelian = [...addPembelian];
            const index = updatedAddPembelian.findIndex((item) => item.barcode === rowData.barcode && item.bonus === rowData.bonus);
            if (index !== -1) {
                updatedAddPembelian[index] = {
                    ...updatedAddPembelian[index],
                    [fieldName]: value
                };
                setAddPembelian(updatedAddPembelian);
                updatePembulatan(updatedAddPembelian);
            }
        };

        switch (field) {
            case 'terima':
                const editedQty = parseFloat(newValue);
                if (!isNaN(editedQty)) {
                    if (editedQty === 0 || newValue === '') {
                        deleteSelectedRow(rowData);
                    } else {
                        updateAndSetPembelian((item) => {
                            if (item.barcode === rowData.barcode && item.bonus === rowData.bonus) {
                                const addedData = rowData;
                                const ketAsal = 'editQTYFromTable';
                                const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, null, editedQty, undefined, ketAsal, null, null, null);

                                const { updatedGrandTotalDisc, subtotal, totDiscQty, totPpnQty } = funcCalculate;

                                const qty = addedData.qtypo;
                                const terimaBrg = addedData.terimabarang || 0;
                                const sisaQty = qty - terimaBrg;

                                if ((!addedData.bonus && editedQty <= sisaQty) || addedData.bonus || jenis === 'tanpapo') {
                                    return { ...item, terima: editedQty, subtotal, grandtotal: updatedGrandTotalDisc, discount: totDiscQty, ppn: totPpnQty };
                                } else {
                                    toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Jumlah Terima Tidak Boleh Melebihi QTY PO', life: 3000 });
                                }
                            }
                            return item;
                        });
                    }
                }
                break;

            case 'hb':
                if (isPositiveInteger(newValue)) {
                    const editHargaBeli = parseFloat(newValue);
                    updateAndSetPembelian((item) => {
                        if (item.barcode === rowData.barcode && item.bonus === rowData.bonus) {
                            const addedData = rowData;
                            const ketAsal = 'editHargaBeliFromTable';
                            const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, null, undefined, null, ketAsal, editHargaBeli, null, null);
                            const { updatedGrandTotalDisc, subtotal, totDiscQty, totPpnQty } = funcCalculate;

                            return { ...item, subtotal, hb: editHargaBeli, grandtotal: updatedGrandTotalDisc, discount: totDiscQty, ppn: totPpnQty };
                        }
                        return item;
                    });
                }
                break;

            case 'discount':
                if (isPositiveInteger(newValue) || newValue === '0') {
                    let editDiscount = parseFloat(newValue);
                    updateAndSetPembelian((item) => {
                        if (item.barcode === rowData.barcode && item.bonus === rowData.bonus) {
                            if (editDiscount > item.hb) {
                                editDiscount = 0;
                                showError(toast, "Diskon tidak boleh melebihi Subtotal");
                            }

                            const addedData = rowData;
                            const qtyToAdd = addedData.terima;
                            const ketAsal = 'editDiscountFromTable';
                            const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, qtyToAdd, undefined, null, ketAsal, null, editDiscount, null);
                            const { updatedGrandTotalDisc, subtotal, totDiscQty, totPpnQty } = funcCalculate;

                            return { ...item, subtotal, grandtotal: updatedGrandTotalDisc, discount: editDiscount, ppn: totPpnQty };
                        }
                        return item;
                    });
                }
                break;

            case 'ppn':
                if (isPositiveInteger(newValue) || newValue === '0') {
                    const editPpn = parseFloat(newValue);
                    updateAndSetPembelian((item) => {
                        if (item.barcode === rowData.barcode && item.bonus === rowData.bonus) {
                            const addedData = rowData;
                            const qtyToAdd = addedData.QTY;
                            const ketAsal = 'editPpnFromTable';
                            const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, qtyToAdd, undefined, null, ketAsal, null, null, editPpn);
                            const { updatedGrandTotalDisc, subtotal, totDiscQty } = funcCalculate;

                            return { ...item, subtotal, grandtotal: updatedGrandTotalDisc, discount: totDiscQty, ppn: editPpn };
                        }
                        return item;
                    });
                }
                break;

            case 'tglexp':
                updateItemField('tglexp', newValue);
                break;

            case 'hj':
                updateItemField('hj', newValue);
                break;

            default:
                event.preventDefault();
                break;
        }
    };

    const cellEditor = (options) => {
        return textEditor(options);
    };

    const textEditor = (options) => {
        return <InputText type="number" value={options.value} onChange={(e) => options.editorCallback(e.target.value)} />;
    };

    // Yang Handle Gudang
    const btnGudang = () => {
        setGudangDialog(true);
    };
    const handleGudangData = (gudangKode, gudangKet) => {
        setPembelian((prevPembelian) => ({
            ...prevPembelian,
            gudang: gudangKode,
            ketgudang: gudangKet
        }));
    };

    // Yang Handle Faktur PO
    const btnFakturPo = () => {
        setFakturPoDialog(true);
    };

    const handleFakturPoData = (dataPO) => {
        setPembelian((prevPembelian) => ({
            ...prevPembelian,
            po: dataPO.faktur,
            fakturasli: dataPO.fakturasli,
            tglpo: dataPO.tgl,
            tgldo: dataPO.tgldelivery,
            jthtmp: dataPO.jthtmp,
            supplier: dataPO.supplier,
            nama: dataPO.nama,
            alamat: dataPO.alamat,
            persdisc: dataPO.persdisc,
            ppn: dataPO.ppn
        }));
        setAddPembelian(dataPO.detail);
    };

    // Yang Handle Button Produk
    const btnProduk = () => {
        setProdukDialog(true);
    };

    const handleProdukData = (produkFaktur) => {
        {
            jenis === 'tanpapo'
                ? onRowSelectBarcodeTanpaPO({ data: produkFaktur })
                : onRowSelectBarcodeDenganPO({ data: produkFaktur })
        }

    };

    const rightFooterTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    {/* <Button label="Clear" className="p-button-danger p-button mr-2"/> */}
                    <Button label="Save" className="p-button-primary p-button mr-2" onClick={saveData} />
                    <Button
                        label="Cancel"
                        className="p-button-secondary p-button"
                        onClick={() => {
                            router.push('/pembelian/penerimaan-barang');
                        }}
                    />
                </div>
            </React.Fragment>
        );
    };

    const totQty = addPembelian.reduce((accumulator, item) => accumulator + parseFloat(item.qtypo), 0);
    const totDiterima = addPembelian.reduce((accumulator, item) => {
        const returValue = parseFloat(item.terimabarang);
        return isNaN(returValue) ? accumulator : accumulator + returValue;
    }, 0);
    const totTerima = addPembelian.reduce((accumulator, item) => {
        const returValue = parseFloat(item.terima);
        return isNaN(returValue) ? accumulator : accumulator + returValue;
    }, 0);
    const totSubTotal = addPembelian.reduce((accumulator, item) => {
        const returValue = parseFloat(item.subtotal);
        return isNaN(returValue) ? accumulator : accumulator + returValue;
    }, 0);
    const totDisc = addPembelian.reduce((accumulator, item) => accumulator + parseFloat(item.discount), 0);
    const totPpn = addPembelian.reduce((accumulator, item) => accumulator + parseFloat(item.ppn), 0);
    const totGrandTotal = addPembelian.reduce((accumulator, item) => {
        const returValue = parseFloat(item.grandtotal);
        return isNaN(returValue) ? accumulator : accumulator + returValue;
    }, 0);

    let footerGroup = (
        <ColumnGroup>
            <Row>
                <Column footer="Total:" colSpan={2} footerStyle={{ textAlign: 'right' }} />
                {jenis === 'denganpo' && (
                    <Column

                        colSpan={1}
                        footer={totQty.toString()}
                    />
                )}
                {jenis === 'denganpo' && (
                    <Column

                        colSpan={1}
                        footer={totDiterima.toString()}
                    />
                )}

                <Column colSpan={3} footer={totTerima.toString()} />
                <Column colSpan={1} footer={`${totSubTotal.toLocaleString()}`} />
                <Column colSpan={1} footer={`${totDisc.toLocaleString()}`} />
                <Column colSpan={1} footer={`${totPpn.toLocaleString()}`} />
                <Column colSpan={1} footer={`${totGrandTotal.toLocaleString()}`} />
                <Column colSpan={3} />
            </Row>
        </ColumnGroup>
    );

    const deleteSelectedRow = (rowData) => {
        const updatedAddPembelian = addPembelian.filter((row) => row !== rowData);
        setAddPembelian(updatedAddPembelian);
    };

    const actionBodyTabel = (rowData) => {
        return (
            <>
                <Button icon="pi pi-trash" style={{ backgroundColor: '#ca656f', border: '1px solid #ca656f' }} className="p-button-danger p-button p-button-sm mr-2" onClick={() => deleteSelectedRow(rowData)} />
            </>
        );
    };

    // Yang Handle Data Edit
    const fetchDataForEdit = async () => {
        const FAKTUR = localStorage.getItem('FAKTUR');
        setLoading(true);
        try {
            let requestBody = {
                faktur: FAKTUR
            };

            const vaTable = await postData(apiEndPointGetDataEdit, requestBody);
            const json = vaTable.data;

            setPembelian(json.data);
            const addPembelian = json.data.tabelTransaksiPembelian;
            let _data = [...addPembelian];
            if (_data && Array.isArray(_data)) {
                const funcCalculateArray = [];
                for (let i = 0; i < _data.length; i++) {
                    const data = _data[i];
                    const ketAsal = 'dataEdit';
                    if (data.jumlah === 0) {
                        funcCalculateArray.push({
                            subtotal: 0,
                            totDiscQty: 0,
                            totPpnQty: 0,
                            updatedGrandTotalDisc: 0
                        });
                    } else {
                        const funcCalculate = await calculateUpdatedGrandTotalDisc(data, null, null, null, ketAsal);
                        funcCalculateArray.push(funcCalculate);
                    }
                }
                setAddPembelian(() => {
                    const updatedAddItem = _data.map((data, index) => {
                        const funcCalc = funcCalculateArray[index];
                        return {
                            kode: data.kode,
                            barcode: data.barcode,
                            nama: data.nama,
                            qtypo: data.qtypo,
                            terimabarang: data.terimabarang,
                            terima: data.terima,
                            discount: data.discount,
                            ppn: data.ppn,
                            satuan: data.satuan,
                            hb: data.hb,
                            hj: data.hj,
                            tglexp: data.tglexp,
                            subtotal: data.jumlah === 0 ? 0 : funcCalc.subtotal,
                            grandtotal: data.jumlah === 0 ? 0 : funcCalc.updatedGrandTotalDisc
                        };
                    });
                    return updatedAddItem;
                });
            } else {
                setAddPembelian([]);
            }
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
            setTimeout(() => {
                router.push('/pembelian/penerimaan-barang');
            }, 2000);
        } finally {
            setLoading(false);
        }
    };

    // Yang Handle Supplier
    const btnSupplier = () => {
        setSupplierDialog(true);
    };

    const handleSupplierData = (supplierKode, supplierNama, supplierAlamat) => {
        setPembelian((prevState) => ({
            ...prevState,
            supplier: supplierKode,
            nama: supplierNama,
            alamat: supplierAlamat
        }));
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>{`${formattedStatus} Pembelian / Penerimaan Barang ${formattedJenis}`}</h4>
                    <hr></hr>
                    <Toast ref={toast} />
                    <div>
                        <div className="formgrid grid">
                            <div className={`field col-6 mb-2 ${jenis === 'tanpapo' ? 'lg:col-6' : 'lg:col-4'}`}>
                                <label htmlFor="faktur">Faktur</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly value={pembelian.faktur} />
                                </div>
                            </div>
                            {jenis !== 'tanpapo' && (
                                <div className="field col-6 mb-2 lg:col-4">
                                    <label htmlFor="faktur">Faktur PO</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly value={pembelian.po} placeholder="Pilih Faktur PO" />
                                        <Button icon="pi pi-search" className="p-button" onClick={btnFakturPo} disabled={readOnlyEdit} />
                                    </div>
                                </div>
                            )}

                            <div className={`field col-6 mb-2 ${jenis === 'tanpapo' ? 'lg:col-6' : 'lg:col-4'}`}>
                                <label htmlFor="fakturasli">Faktur Asli</label>
                                <div className="p-inputgroup">
                                    <InputText value={pembelian.fakturasli} onChange={(e) => onInputChange(e, 'fakturasli')} required />
                                </div>
                            </div>

                            <div className={`field col-6 mb-2 ${jenis === 'tanpapo' ? 'lg:col-6' : 'lg:col-3'}`}>
                                <label htmlFor="tanggal">Tanggal Faktur</label>
                                <div className="p-inputgroup">
                                    <Calendar id="tgl" value={pembelian.tgl ? new Date(pembelian.tgl) : new Date()} onChange={(e) => onInputChange(e, 'TGL')} showIcon dateFormat="dd-mm-yy" />
                                </div>
                            </div>
                            {jenis !== 'tanpapo' && (
                                <div className={`field col-6 mb-2 ${jenis === 'tanpapo' ? 'lg:col-6' : 'lg:col-3'}`}>
                                    <label htmlFor="tanggal">Tanggal PO</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly id="jatuhtempo" value={formatDate(pembelian.tglpo || new Date())} showIcon />
                                        <Button icon="pi pi-calendar" className="p-button" />
                                    </div>
                                </div>
                            )}
                            {jenis !== 'tanpapo' && (
                                <div className="field col-6 mb-2 lg:col-3">
                                    <label htmlFor="tanggal">Tanggal DO</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly id="tgl" value={formatDate(pembelian.tgldo || new Date())} showIcon dateFormat="dd-mm-yy" />
                                        <Button icon="pi pi-calendar" className="p-button" />
                                    </div>
                                </div>
                            )}

                            <div className={`field col-6 mb-2 ${jenis === 'tanpapo' ? 'lg:col-6' : 'lg:col-3'}`}>
                                <label htmlFor="tanggal">Jatuh Tempo</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly id="jatuhtempo" value={formatDate(pembelian.jthtmp || new Date())} showIcon dateFormat="dd-mm-yy" />
                                    <Button icon="pi pi-calendar" className="p-button" />
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-6">
                                <label htmlFor="supplier">Supplier</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly value={pembelian.supplier} />
                                    {jenis === 'tanpapo' && (
                                        <Button icon="pi pi-search" className="p-button" onClick={btnSupplier} />
                                    )}
                                    <InputText readOnly value={pembelian.nama} />
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-6">
                                <label htmlFor="kota">Alamat</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly value={pembelian.alamat} />
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-6">
                                <label htmlFor="fakturasli">Keterangan</label>
                                <div className="p-inputgroup">
                                    <InputText value={pembelian.keterangan} onChange={(e) => onInputChange(e, 'keterangan')} />
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-6">
                                <label htmlFor="">Gudang</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly value={pembelian.gudang} />
                                    <Button icon="pi pi-search" className="p-button" onClick={btnGudang} disabled={readOnlyEdit} />
                                    <InputText readOnly value={pembelian.ketgudang} />
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-4">
                                <label htmlFor="discount">Pembulatan</label>
                                <div className="p-inputgroup">
                                    <Button className="p-button" readOnly>
                                        <span>Rp</span>
                                    </Button>
                                    <InputNumber value={pembelian.pembulatan} inputStyle={{ textAlign: 'right' }} onChange={(e) => onInputNumberChange(e, 'pembulatan')}></InputNumber>
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-4">
                                <label htmlFor="discount">Total</label>
                                <div className="p-inputgroup">
                                    <Button className="p-button" readOnly>
                                        <span>Rp</span>
                                    </Button>
                                    <InputNumber value={pembelian.grandTotal} inputStyle={{ textAlign: 'right' }} readOnly></InputNumber>
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-3">
                                <label htmlFor="Pembayaran" style={{ marginBottom: '10px' }}>Pembayaran</label>
                                <div className="formgrid grid">
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <div className="p-inputgroup">
                                            <RadioButton inputId="kredit" name="pembayaran" value="K" onChange={handleRadioChange} style={{ marginRight: '5px' }} checked={pembelian.pembayaran === 'K'} />
                                            <label htmlFor="kredit">
                                                Kredit
                                            </label>
                                        </div>
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <div className="p-inputgroup">
                                            <RadioButton inputId="tunai" name="pembayaran" value="T" onChange={handleRadioChange} style={{ marginRight: '5px' }} checked={pembelian.pembayaran === 'T'} />
                                            <label htmlFor="tunai">Tunai</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-12">
                                <label htmlFor="supplier">Barcode</label>
                                <div className="p-inputgroup">
                                    <InputText id="barcode" onKeyDown={handleBarcodeKeyDown} />
                                    <Button icon="pi pi-search" className="p-button" onClick={btnProduk} />
                                </div>
                            </div>
                            {/* </div> */}
                        </div>
                    </div>
                    <hr></hr>
                    {/* value={bayarFakturTabel.filter(row => statusFilter === 'B' ? row.pembayaran !== 0 : row.pembayaran === 0)} // Filter data sesuai status filter */}
                    <div className={styles.datatableContainer}>
                        <DataTable
                            value={addPembelian}
                            lazy
                            dataKey="kode"
                            className="datatable-responsive"
                            first={lazyState.first}
                            loading={loading}
                            footerColumnGroup={footerGroup}
                            size="small"
                            scrollable
                            scrollHeight="200px"
                            frozenFooter
                        >
                            <Column field="barcode" header="KODE"></Column>
                            <Column field="nama" header="NAMA"></Column>
                            {jenis === 'denganpo' && (
                                <Column
                                    field="qtypo"
                                    header="QTY PO"
                                    body={(rowData) => {
                                        const value = rowData.qtypo ? parseInt(rowData.qtypo).toLocaleString() : 0;
                                        return value;
                                    }}
                                ></Column>
                            )}
                            {jenis === 'denganpo' && (
                                <Column
                                    field="terimabarang"
                                    header="TERIMA BRG"
                                    body={(rowData) => {
                                        const value = rowData.terimabarang ? parseInt(rowData.terimabarang).toLocaleString() : '0';
                                        return value;
                                    }}
                                ></Column>
                            )}
                            <Column
                                field="terima"
                                header="TERIMA"
                                editor={(options) => cellEditor(options)}
                                onCellEditComplete={onCellEditComplete}
                                body={(rowData) => {
                                    const value = rowData.terima ? parseInt(rowData.terima).toLocaleString() : '0';
                                    return value;
                                }}

                            ></Column>
                            <Column field="satuan" header="SATUAN"></Column>
                            <Column
                                field="hb"
                                header="HARGA BELI"
                                body={(rowData) => {
                                    const value = rowData.hb ? parseInt(rowData.hb).toLocaleString() : 0;
                                    return value;
                                }}
                                // editor={(options) => textEditor(options)}
                                editor={(options) => {
                                    if (options.rowData.bonus) {
                                        return parseInt(options.rowData.hb).toLocaleString();
                                    }
                                    return textEditor(options);
                                }}
                                onCellEditComplete={(e) => {
                                    if (e.rowData && e.rowData.bonus) {
                                        return;
                                    }
                                    onCellEditComplete(e);
                                }}
                            ></Column>
                            <Column
                                field="subtotal"
                                header="SUBTOTAL"
                                body={(rowData) => {
                                    const value = rowData.subtotal ? parseInt(rowData.subtotal).toLocaleString() : 0;
                                    return value;
                                }}
                            ></Column>
                            <Column
                                field="discount"
                                header="DISCOUNT"
                                editor={(options) => {
                                    if (options.rowData.bonus) {
                                        return parseInt(options.rowData.discount).toLocaleString();
                                    }
                                    return textEditor(options);
                                }}
                                onCellEditComplete={onCellEditComplete}
                                body={(rowData) => formatRibuan(rowData.discount)}

                            ></Column>
                            <Column
                                field="ppn"
                                header="PPN"
                                editor={(options) => {
                                    if (options.rowData.bonus) {
                                        return parseInt(options.rowData.ppn).toLocaleString();
                                    }
                                    return textEditor(options);
                                }}
                                onCellEditComplete={onCellEditComplete}
                                body={(rowData) => {
                                    const value = rowData.ppn ? parseInt(rowData.ppn).toLocaleString() : 0;
                                    return value;
                                }}
                            ></Column>
                            <Column
                                field="grandtotal"
                                header="GRAND TOTAL"
                                body={(rowData) => {
                                    const value = rowData.grandtotal ? parseInt(rowData.grandtotal).toLocaleString() : 0;
                                    return value;
                                }}

                            ></Column>
                            <Column
                                field="hj"
                                header="HARGA JUAL"
                                body={(rowData) => {
                                    const value = rowData.hj ? parseInt(rowData.hj).toLocaleString() : 0;
                                    return value;
                                }}
                                // editor={(options) => textEditor(options)}
                                editor={(options) => {
                                    if (options.rowData.bonus) {
                                        return parseInt(options.rowData.hj).toLocaleString();
                                    } else {
                                        return textEditor(options);
                                    }
                                }}
                                onCellEditComplete={onCellEditComplete}
                            ></Column>
                            <Column field="tglexp" header="EXPIRED" body={(rowData) => formatTglExpired(rowData.tglexp)}></Column>
                            <Column header="ACTION" body={actionBodyTabel}></Column>
                        </DataTable>
                        <br></br>
                    </div>
                    <Toolbar className="mb-4" right={rightFooterTemplate}></Toolbar>
                    <Supplier supplierDialog={supplierDialog} setSupplierDialog={setSupplierDialog} btnSupplier={btnSupplier} handleSupplierData={handleSupplierData} />
                    <Gudang gudangDialog={gudangDialog} setGudangDialog={setGudangDialog} btnGudang={btnGudang} handleGudangData={handleGudangData} />
                    <FakturPo fakturPoDialog={fakturPoDialog} setFakturPoDialog={setFakturPoDialog} btnFakturPo={btnFakturPo} handleFakturPoData={handleFakturPoData} />
                    <Produk produkDialog={produkDialog} setProdukDialog={setProdukDialog} btnProduk={btnProduk} handleProdukData={handleProdukData} />
                </div>
            </div>
        </div>
    );
}
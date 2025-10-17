/**
     * Nama Program: GODONG POS - Pembelian - Purchase Order Add Data
     * Pengembang: Salsabila Emma
     * Tanggal Pengembangan: 21 Feb 2024 (re-coding)
     * Versi: 1.1.0

    Catatan:
    - Versi 1.1.0 mencakup fungsionalitas Menu Purchase Order Add
*/
import { useRouter } from 'next/router';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Row } from 'primereact/row';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { formatDateSave, formatRibuan, showError, showSuccess } from '../../../component/GeneralFunction/GeneralFunction';
import Supplier from '../../component/supplier';
import Reorder from './reorder';
import Repeat from './repeat';

import postData from '../../../lib/Axios';
import { getSessionServerSide } from '../../../utilities/servertool';
import Produk from '../../component/produk';
export const getServerSideProps = async (context) => {
    const sessionData = await getSessionServerSide(context, '/pembelian/purchase-order');
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
function MasterAddPo() {
    const apiEndPointGetFaktur = '/api/get_faktur';
    const apiEndPointGetDataEdit = '/api/purchase_order/getdata_edit';
    const apiEndPointGetBarcode = '/api/produk/get-barcode';
    const apiEndPointStore = '/api/purchase_order/store';
    const apiEndPointUpdate = '/api/purchase_order/update';

    const router = useRouter();
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [addPo, setAddPo] = useState([]);
    const [po, setPo] = useState([]);
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

    const [readOnlyEdit, setReadOnlyEdit] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);

    useEffect(() => {
        const { status } = router.query;
        if (status === 'update') {
            fetchDataForEdit();
            setReadOnlyEdit(true);
            setIsUpdateMode(true); // Set state isUpdateMode to true
        } else {
            loadLazyData();
            setIsUpdateMode(false); // Set state isUpdateMode to false
        }
    }, [router.query]);

    useEffect(() => {
        // Untuk checkbox PPN
        if (po.PPN > 0) {
            setCheckedPpn(true);
        } else {
            setCheckedPpn(false);
        }
        // Untuk checkbox diskon
        if (po.PERSDISC > 0) {
            setChecked(true);
        } else {
            setChecked(false);
        }
    }, [po.PPN, po.PERSDISC]);

    // -----------------------------------------------------------------------------------------------------------------< FAKTUR >
    const loadLazyData = async () => {
        setLoading(true);
        try {
            let requestBody = {
                Kode: 'PO',
                Len: 6
            };
            const vaTable = await postData(apiEndPointGetFaktur, requestBody);
            const json = vaTable.data;
            setTotalRecords(json.total);
            setPo((prevPo) => ({
                ...prevPo,
                FAKTUR: json
            }));
        } catch (error) {
            setLoading(false);
        } finally {
            setLoading(false);
        }
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

    //   ------------------------------------------------------------------------------------------------------------------- < Checked PPN >
    const [checkedPpn, setCheckedPpn] = useState(false);
    const onCheckboxPpnChange = (event) => {
        const isChecked = event.target.checked;
        setCheckedPpn(isChecked);
        if (isChecked) {
            setPo({ ...po, PPN: 11, ketPpn: 'adaAllPpnKolektif' }); // Ketika checkbox dicentang, atur setPo PERSDISC dan ketAsal menjadi "adaAllDiscKolektif"
        } else {
            setPo({ ...po, PPN: 0, ketPpn: 'tanpaAllPpnKolektif' }); // Jika checkbox tidak dicentang, atur setPo PERSDISC menjadi 0 dan ketAsal kosong
        }
    };

    //   ------------------------------------------------------------------------------------------------------------------- < Checked Disc and Func>
    const [checked, setChecked] = useState(false);
    const onCheckboxChange = (event) => {
        setChecked(event.target.checked);
        if (event.target.checked) {
            setPo({ ...po, PERSDISC: po.PERSDISC, ketDisc: 'adaAllDiscKolektif' }); // Ketika checkbox dicentang, atur setPo PERSDISC dan ketAsal menjadi "adaAllDiscKolektif"
        } else {
            setPo({ ...po, PERSDISC: 0, ketDisc: 'tanpaAllDiscKolektif' }); // Jika checkbox tidak dicentang, atur setPo PERSDISC menjadi 0 dan ketAsal kosong
        }
    };

    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        let _po = { ...po };
        _po[`${name}`] = val;
        setPo(_po);
    };
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _data = { ...po };
        _data[`${name}`] = val;
        setPo(_data);
    };

    // -----------------------------------------------------------------------------------------------------------------< PRODUK / BARCODE >
    const [produkDialog, setProdukDialog] = useState(false);
    const btnProduk = () => {
        setProdukDialog(true);
    };
    const handleProduk = (dataProduk) => {
        onRowSelectBarcode({ data: dataProduk });
    };

    const calculateUpdatedGrandTotalDisc = (
        addedData,
        qtyToAdd,
        editedQty,
        editedDisc,
        ketAsal,
        editHargaBeli,
        editNominalDisc,
        editNominalPpn
    ) => {
        let QTY = addedData.QTY ?? 0;
        let HARGABELI = addedData.HARGABELI ?? 0;
        let DISCOUNT = addedData.DISCOUNT ?? 0;
        let PAJAK = addedData.PAJAK ?? 0;
        let HARGADISCQTY = addedData.HARGADISCQTY ?? 0;
        let HARGAPPNQTY = addedData.HARGAPPNQTY ?? 0;

        let updatedQTY = QTY;
        let hargaBeli = HARGABELI;
        let discPersen = DISCOUNT / 100;
        let ppnPersen = PAJAK / 100;

        // Gunakan diskon/ppn kolektif jika ada
        if (po.ketDisc === 'adaAllDiscKolektif') discPersen = po.PERSDISC / 100;
        if (po.ketPpn === 'adaAllPpnKolektif') ppnPersen = po.PPN / 100;

        // Tangani ketAsal
        switch (ketAsal) {
            case 'firstEnter':
                updatedQTY = qtyToAdd;
                break;
            case 'existInTable':
                updatedQTY = QTY + qtyToAdd;
                break;
            case 'editQTYFromTable':
                updatedQTY = editedQty;
                break;
            case 'editHargaBeliFromTable':
                hargaBeli = editHargaBeli ?? HARGABELI;
                break;
            case 'editDiscFromTable':
                editNominalDisc = editNominalDisc ?? HARGADISCQTY;
                break;
            case 'dataEdit':
            case 'dataReorder':
                return {
                    updatedGrandTotalDisc: (QTY * HARGABELI) - DISCOUNT + PAJAK,
                    hargaDisc: 0,
                    subTotal: QTY * HARGABELI,
                    disc: discPersen,
                    updatedQTY: QTY,
                    hargaPpn: 0,
                    ppn: ppnPersen,
                    totDiscQty: DISCOUNT,
                    totPpnQty: PAJAK,
                    hargaBeli: HARGABELI,
                };
            default:
                break;
        }

        const hargaDisc = hargaBeli * discPersen;
        const hargaPpn = hargaBeli * ppnPersen;

        const totDiscQty = ketAsal === 'editDiscFromTable'
            ? editNominalDisc
            : (po.ketDisc === 'adaAllDiscKolektif' || !HARGADISCQTY)
                ? hargaDisc * updatedQTY
                : HARGADISCQTY;

        const totPpnQty = ketAsal === 'editDiscFromTable' || ketAsal === 'editHargaBeliFromTable'
            ? (po.ketPpn === 'adaAllPpnKolektif' || !HARGAPPNQTY)
                ? hargaPpn * updatedQTY
                : HARGAPPNQTY
            : (editNominalPpn ?? hargaPpn * updatedQTY);

        const subTotal = updatedQTY * hargaBeli;
        const updatedGrandTotalDisc = subTotal - totDiscQty + totPpnQty;

        return {
            updatedGrandTotalDisc,
            hargaDisc,
            subTotal,
            disc: discPersen,
            updatedQTY,
            hargaPpn,
            ppn: ppnPersen,
            totDiscQty,
            totPpnQty,
            hargaBeli,
        };
    };

    const onRowSelectBarcode = async (event) => {
        const selectedKode = event.data.KODE_TOKO;
        const enteredQty = event.qty || 1;
        const selectedBarcode = { KODE_TOKO: selectedKode };

        if (!selectedBarcode) {
            setProdukDialog(false);
            return;
        }

        try {
            // --- API
            const vaTable = await postData(apiEndPointGetBarcode, { Barcode: `%${selectedKode}%` });
            const json = vaTable.data.data;
            const valBarcode = json[0].BARCODE;
            const existingIndex = addPo.findIndex((item) => item.BARCODE === valBarcode);
            const qtyToAdd = json.QTY || enteredQty || 1;

            if (existingIndex !== -1) {
                // -------------------------------------------------------------- Sudah ada di addPo
                setAddPo((prevAddPo) => {
                    const ketAsal = 'existInTable';
                    const updatedAddPo = [...prevAddPo];
                    const existingData = updatedAddPo[existingIndex];
                    const updatedQTY = existingData.QTY + qtyToAdd;

                    // Panggil fungsi calculateUpdatedGrandTotalDisc
                    const funcCalculate = calculateUpdatedGrandTotalDisc(
                        existingData,
                        updatedQTY,
                        undefined,
                        undefined,
                        ketAsal
                    );

                    // Ambil hasil perhitungan
                    const updatedGrandTotalDisc = funcCalculate.updatedGrandTotalDisc;
                    const subTotal = funcCalculate.subTotal;
                    const totDiscQty = funcCalculate.totDiscQty;
                    const totPpnQty = funcCalculate.totPpnQty;

                    // Perbarui item yang sudah ada di array
                    updatedAddPo[existingIndex] = {
                        ...existingData,
                        QTY: updatedQTY,
                        SUBTOTAL: subTotal,
                        GRANDTOTAL: updatedGrandTotalDisc,
                        HARGADISCQTY: totDiscQty,
                        HARGAPPNQTY: totPpnQty,
                    };

                    return updatedAddPo;
                });
            } else {
                // -------------------------------------------------------------- Belum ada di addPo
                const ketAsal = 'firstEnter';
                const jsonWithDefaultQty = json.map((item) => ({ ...item, QTY: qtyToAdd }));

                // Siapkan data baru untuk ditambahkan
                const addedData = {
                    ...json[0],
                    QTY: qtyToAdd,
                };

                const funcCalculate = calculateUpdatedGrandTotalDisc(
                    addedData,
                    qtyToAdd,
                    undefined,
                    undefined,
                    ketAsal
                );

                // Ambil hasil perhitungan
                const updatedGrandTotalDisc = funcCalculate.updatedGrandTotalDisc;
                const subTotal = funcCalculate.subTotal;
                const totDiscQty = funcCalculate.totDiscQty;
                const totPpnQty = funcCalculate.totPpnQty;

                setAddPo((prevAddPo) => [
                    ...prevAddPo,
                    {
                        ...addedData,
                        SUBTOTAL: subTotal,
                        GRANDTOTAL: updatedGrandTotalDisc,
                        HARGADISCQTY: totDiscQty,
                        HARGAPPNQTY: totPpnQty,
                    },
                    ...jsonWithDefaultQty.slice(1),
                ]);
            }

            const newDataRow = document.getElementById('new-data-row'); // Ganti dengan ID atau ref dari elemen yang menampilkan data baru dimasukkan
            if (newDataRow) {
                newDataRow.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Menggulirkan elemen baru ke tengah layar jika perlu
            }

            setProdukDialog(false);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };


    const onQtyUpdate = (updatedAddPo) => {
        setAddPo(updatedAddPo);
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

    // ----------------------------------------------------------------------------------------< edit in cell >
    const onCellEditComplete = (e) => {
        let { rowData, newValue, field, originalEvent: event } = e;

        switch (field) {
            case 'QTY':
                if (!isNaN(newValue)) {
                    // Check if newValue is a valid number
                    const editedQty = parseFloat(newValue);

                    if (!isNaN(editedQty)) {
                        // Check if editedQty is a valid number
                        if (editedQty === 0 || editedQty === '') {
                            deleteSelectedRow(rowData);
                        } else {
                            const updatedAddPo = addPo.map((item) => {
                                if (item.BARCODE === rowData.BARCODE) {
                                    const addedData = rowData;
                                    const initialQty = addedData.QTY;
                                    const qtyToAdd = editedQty - initialQty;
                                    const ketAsal = 'editQTYFromTable';

                                    const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, null, editedQty, undefined, ketAsal, null, null, null);
                                    const updatedGrandTotalDisc = funcCalculate.updatedGrandTotalDisc;
                                    const hargaDisc = funcCalculate.hargaDisc;
                                    const subTotal = funcCalculate.subTotal;
                                    const totDiscQty = funcCalculate.totDiscQty;
                                    const totPpnQty = funcCalculate.totPpnQty;

                                    return { ...item, QTY: editedQty, SUBTOTAL: subTotal, GRANDTOTAL: updatedGrandTotalDisc, HARGADISCQTY: totDiscQty, HARGAPPNQTY: totPpnQty };
                                } else {
                                    return item;
                                }
                            });

                            setAddPo(updatedAddPo);

                            // Call a function in index.js to handle the updated addPo
                            if (onQtyUpdate) {
                                onQtyUpdate(updatedAddPo);
                            }
                        }
                    } else {
                        // Handle the case when newValue is not a valid number
                        console.log('Invalid input. Please enter a valid number for QTY.');
                    }
                } else {
                    // Handle the case when newValue is not a valid number
                    console.log('Invalid input. Please enter a valid number for QTY.');
                }
                break;
            case 'HARGABELI':
                if (!isNaN(newValue)) {
                    let editHargaBeli = parseInt(newValue);
                    if (editHargaBeli < 0) {
                        toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Harga Beli Tidak Boleh Lebih dari 100%', life: 3000 });
                        return;
                    }
                    const updatedAddPo = addPo.map((item) => {
                        if (item.BARCODE === rowData.BARCODE) {
                            const addedData = rowData;
                            const qtyToAdd = addedData.QTY;
                            const ketAsal = 'editHargaBeliFromTable';

                            const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, qtyToAdd, undefined, null, ketAsal, editHargaBeli, null, null);
                            const updatedGrandTotalDisc = funcCalculate.updatedGrandTotalDisc;
                            const hargaDisc = funcCalculate.hargaDisc;
                            const subTotal = funcCalculate.subTotal;
                            const totDiscQty = funcCalculate.totDiscQty;
                            const totPpnQty = funcCalculate.totPpnQty;

                            return { ...item, SUBTOTAL: subTotal, HARGABELI: editHargaBeli, GRANDTOTAL: updatedGrandTotalDisc, HARGADISCQTY: totDiscQty, HARGAPPNQTY: totPpnQty };
                        } else {
                            return item;
                        }
                    });

                    setAddPo(updatedAddPo);

                    // Call a function in index.js to handle the updated addPo
                    if (onQtyUpdate) {
                        onQtyUpdate(updatedAddPo);
                    }
                } else {
                    // Handle the case when newValue is not a valid integer
                    console.log('Invalid input. Please enter a valid integer for DISCOUNT.');
                }
                break;
            case 'HARGADISCQTY':
                if (!isNaN(newValue)) {
                    let editNominalDisc = parseInt(newValue);
                    if (editNominalDisc < 0) {
                        toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Disc Tidak Boleh Lebih dari 100%', life: 3000 });
                        return;
                    }
                    const updatedAddPo = addPo.map((item) => {
                        if (item.BARCODE === rowData.BARCODE) {
                            const addedData = rowData;
                            const qtyToAdd = addedData.QTY;
                            const ketAsal = 'editDiscFromTable';

                            const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, qtyToAdd, undefined, null, ketAsal, null, editNominalDisc, null);

                            const updatedGrandTotalDisc = funcCalculate.updatedGrandTotalDisc;
                            const hargaDisc = funcCalculate.hargaDisc;
                            const subTotal = funcCalculate.subTotal;
                            const totDiscQty = funcCalculate.totDiscQty;
                            const totPpnQty = funcCalculate.totPpnQty;

                            return { ...item, SUBTOTAL: subTotal, GRANDTOTAL: updatedGrandTotalDisc, HARGADISCQTY: editNominalDisc, HARGAPPNQTY: totPpnQty };
                        } else {
                            return item;
                        }
                    });

                    setAddPo(updatedAddPo);

                    // Call a function in index.js to handle the updated addPo
                    if (onQtyUpdate) {
                        onQtyUpdate(updatedAddPo);
                    }
                } else {
                    // Handle the case when newValue is not a valid integer
                    console.log('Invalid input. Please enter a valid integer for DISCOUNT.');
                }
                break;
            case 'HARGAPPNQTY':
                if (!isNaN(newValue)) {
                    let editNominalPpn = parseInt(newValue);
                    if (editNominalPpn < 0) {
                        toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Disc Tidak Boleh Lebih dari 100%', life: 3000 });
                        return;
                    }
                    const updatedAddPo = addPo.map((item) => {
                        if (item.BARCODE === rowData.BARCODE) {
                            const addedData = rowData;
                            const qtyToAdd = addedData.QTY;
                            const ketAsal = 'editPpnFromTable';

                            const funcCalculate = calculateUpdatedGrandTotalDisc(addedData, qtyToAdd, undefined, null, ketAsal, null, null, editNominalPpn);
                            const updatedGrandTotalDisc = funcCalculate.updatedGrandTotalDisc;
                            const hargaDisc = funcCalculate.hargaDisc;
                            const subTotal = funcCalculate.subTotal;
                            const totDiscQty = funcCalculate.totDiscQty;
                            const totPpnQty = funcCalculate.totPpnQty;

                            return { ...item, SUBTOTAL: subTotal, GRANDTOTAL: updatedGrandTotalDisc, HARGADISCQTY: totDiscQty, HARGAPPNQTY: editNominalPpn };
                        } else {
                            return item;
                        }
                    });

                    setAddPo(updatedAddPo);

                    // Call a function in index.js to handle the updated addPo
                    if (onQtyUpdate) {
                        onQtyUpdate(updatedAddPo);
                    }
                } else {
                    // Handle the case when newValue is not a valid integer
                    console.log('Invalid input. Please enter a valid integer for DISCOUNT.');
                }
                break;
            default:
                break;
        }
    };

    const textEditor = (options) => {
        return <InputText type="number" step="any" value={options.value} onChange={(e) => options.editorCallback(e.target.value)} />;
    };

    const deleteSelectedRow = (rowData) => {
        const updatedAddPo = addPo.filter((row) => row !== rowData);
        setAddPo(updatedAddPo);
    };

    const actionBodyTabel = (rowData) => {
        return (
            <>
                <Button icon="pi pi-trash" style={{ backgroundColor: '#ca656f', border: '1px solid #ca656f' }} className="p-button-danger p-button p-button-sm mr-2" onClick={() => deleteSelectedRow(rowData)} />
            </>
        );
    };
    // ----------------------------------------------------------------------------------------------------------------------
    const [inputValue, setInputValue] = useState('');
    const [defaultOption, setDropdownValue] = useState(null);

    const dropdownValues = [
        { name: 'KODE_TOKO', label: 'BARCODE' },
        { name: 'NAMA', label: 'NAMA' }
    ];
    const inputChanged = (e) => {
        clearTimeout(timer);

        const newTimer = setTimeout(() => {
            let _lazyState = { ...lazyState };

            _lazyState['filters'] = { ...lazyState.filters }; // Copy existing filters
            // if (selectedSesi) {
            //     // Add selectedSesi to filters if available
            //     _lazyState.filters["selectedSesi"] = selectedSesi;
            // }
            if (defaultOption != null && defaultOption.name != null) {
                _lazyState['filters'][defaultOption.name] = e;
            }
            onPage(_lazyState);
        }, 500);

        setTimer(newTimer);
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"> </h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="label" placeholder="Pilih Kolom" />
                &nbsp;
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => inputChanged(e.target.value)} placeholder="Search..." />
                </span>
            </div>
        </div>
    );
    // ----------------------------------------------------------------------------------------------------------------< Save PO >
    const createDataObject = (_po, _addPo) => {
        let data = {
            FAKTUR: _po.FAKTUR,
            FAKTURASLI: _po.FAKTURASLI,
            TGL: isUpdateMode ? _po.TGL : formatDateSave(_po.TGL || new Date()),
            TGLDO: isUpdateMode ? _po.TGLDO : formatDateSave(_po.TGLDO || new Date()),
            JTHTMP: isUpdateMode ? _po.JTHTMP : formatDateSave(_po.JTHTMP || new Date()),
            SUPPLIER: _po.SUPPLIER || supplierKode,
            PERSDISC: _po.PERSDISC || 0,
            PPN: _po.PPN,
            DISCOUNT: totDiscount || 0,
            PAJAK: totPpn || 0,
            KETERANGAN: _po.KETERANGAN,
            SUBTOTAL: totSubTotal,
            TOTAL: totGrandTotal,
            tabelTransaksiPo: _addPo
                .map((item) => {
                    const QTY = item.QTY !== null ? item.QTY : 0;
                    if (QTY > 0) {
                        return {
                            BARCODE: item.BARCODE,
                            // NAMA: item.NAMA,
                            TGLPO: isUpdateMode ? _po.TGLPO : formatDateSave(_po.TGLPO || new Date()),
                            TGLDELIVERY: isUpdateMode ? _po.TGLDELIVERY : formatDateSave(_po.TGLDELIVERY || new Date()),
                            QTY: item.QTY,
                            SATUAN: item.SATUAN,
                            HARGA: item.HARGABELI,
                            DISCOUNT: item.HARGADISCQTY,
                            PPN: item.HARGAPPNQTY,
                            TGLEXP: item.TGLEXP || '2024-03-30',
                            JUMLAH: item.GRANDTOTAL
                        };
                    } else {
                        return null;
                    }
                })
                .filter((item) => item !== null)
        };
        return data;
    };

    const savePo = async (e) => {
        e.preventDefault();
        let _po = { ...po };
        let _addPo = [...addPo];
        let _data = createDataObject(_po, _addPo);
        if (!_data.SUPPLIER) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Supplier Masih Kosong!', life: 3000 });
            return;
        }
        if (_data.tabelTransaksiPo.length === 0) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'QTY Masih Kosong Semua!', life: 3000 });
            return;
        }
        if (addPo.length == 0) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Daftar Barang Masih Kosong!', life: 3000 });
            return;
        }
        // return;
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
            router.push('/pembelian/purchase-order');
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };
    // ---------------------------------------------------------------------------------------------------------------- Button
    const rightFooterTemplate = (rowData) => {
        return (
            <React.Fragment>
                <div className="my-2">
                    {/* <Button label="Delete" className="p-button-danger p-button mr-2" onClick={deleteSelectedRow}/> */}
                    <Button label="Save" className="p-button-primary p-button mr-2" onClick={savePo} />
                    <Button
                        label="Cancel"
                        className="p-button-secondary p-button"
                        onClick={() => {
                            router.push('/pembelian/purchase-order');
                        }}
                    />
                </div>
            </React.Fragment>
        );
    };

    const totQty = addPo.reduce((accumulator, item) => accumulator + parseFloat(item.QTY), 0);
    const totSubTotal = addPo.reduce((accumulator, item) => accumulator + parseInt(item.SUBTOTAL), 0);
    const totDiscount = addPo.reduce((accumulator, item) => accumulator + parseInt(item.HARGADISCQTY), 0);
    const totPpn = addPo.reduce((accumulator, item) => accumulator + parseInt(item.HARGAPPNQTY), 0);
    const totGrandTotal = addPo.reduce((accumulator, item) => accumulator + parseInt(item.GRANDTOTAL), 0);
    let footerGroup = (
        <ColumnGroup>
            <Row>
                <Column colSpan={1} />
                <Column footer="Total:" />
                <Column colSpan={3} footer={totQty.toString()} />
                <Column colSpan={1} footer={`Rp. ${formatRibuan(totSubTotal)}`} />
                <Column colSpan={1} footer={`${formatRibuan(totDiscount)}`} />
                <Column colSpan={1} footer={`${formatRibuan(totPpn)}`} />
                <Column colSpan={2} footer={`Rp. ${formatRibuan(totGrandTotal)}`} />
            </Row>
        </ColumnGroup>
    );

    // ----------------------------------------------------------------------------------------------------------------------------< EDIT AREA >
    const fetchDataForEdit = async () => {
        try {
            setLoading(true);
            let requestBody = {
                FAKTUR: localStorage.getItem('Faktur')
            };
            const vaTable = await postData(apiEndPointGetDataEdit, requestBody);
            const json = vaTable.data;
            setPo(json.data);
            dataFuncCalculate(json.data.po);
            showSuccess(toast, json?.message);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
            setTimeout(() => {
                router.push('/pembelian/purchase-order');
            }, 2000);
        } finally {
            setLoading(false);
        }
    };
    const dataFuncCalculate = async (data) => {
        if (data && Array.isArray(data)) {
            let _data = [...data];
            const funcCalculateArray = [];
            // Iterasi melalui array dan panggil calculateUpdatedGrandTotalDisc untuk setiap elemen
            for (let i = 0; i < _data.length; i++) {
                const data = _data[i];
                const ketAsal = 'dataEdit';
                const funcCalculate = await calculateUpdatedGrandTotalDisc(data, null, null, null, ketAsal);
                funcCalculateArray.push(funcCalculate);
            }

            // Set addItem setelah semua perhitungan selesai
            setAddPo(() => {
                const updatedAddItem = _data.map((data, index) => {
                    const funcCalc = funcCalculateArray[index];
                    return {
                        KODE: data.KODE,
                        BARCODE: data.BARCODE,
                        NAMA: data.NAMA,
                        QTY: funcCalc.updatedQTY,
                        SATUAN: data.SATUAN,
                        HARGABELI: data.HARGABELI,
                        SUBTOTAL: funcCalc.subTotal,
                        HARGADISCQTY: funcCalc.totDiscQty,
                        HARGAPPNQTY: funcCalc.totPpnQty,
                        GRANDTOTAL: funcCalc.updatedGrandTotalDisc
                    };
                });
                return updatedAddItem;
            });
        } else {
            // If detail is not an array or does not exist, set addPo to an empty array
            setAddPo([]);
        }
    };

    // ----------------------------------------------------------------------------------------------------------------------------< REPEAT AREA >
    const [repeatDialog, setRepeatDialog] = useState(false);
    const btnRepeat = () => {
        setRepeatDialog(true);
        setIsUpdateMode(false);
    };
    // ----------------------------------------------------------------------------------------------------------------------------< REORDER AREA >
    const [reorderDialog, setReorderDialog] = useState(false);
    const btnReorder = () => {
        setReorderDialog(true);
        // if (supplierKode === "") {
        // 	toast.current.show({ severity: "error", summary: "Error Message", detail: "Supplier Masih Kosong!", life: 3000 });
        // 	return;
        // } else {
        //     setReorderDialog(true);
        // }
    };

    return (
        <div className="full-page">
            {/* <div className="col-12"> */}
            <div className="card">
                <h4>{isUpdateMode ? 'Edit' : 'Add'} Purchase Order</h4>
                <hr />
                <Toast ref={toast} />
                <div>
                    <div className="formgrid grid">
                        <div className="field col-6 mb-2 lg:col-6">
                            <div className="formgrid grid">
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label htmlFor="faktur">Faktur</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly value={po.FAKTUR} />
                                    </div>
                                </div>
                                <div className="field col-12 mb-2 lg:col-4">
                                    <label htmlFor="tgl">Tanggal</label>
                                    <div className="p-inputgroup">
                                        <Calendar disabled={readOnlyEdit} value={po.TGL && po.TGL ? new Date(po.TGL) : new Date()} onChange={(e) => onInputChange(e, 'TGL')} id="tgl" showIcon dateFormat="dd-mm-yy" />
                                    </div>
                                </div>
                                <div className="field col-12 mb-2 lg:col-4">
                                    <label htmlFor="tgl">Tanggal DO</label>
                                    <div className="p-inputgroup">
                                        <Calendar disabled={readOnlyEdit} value={po.TGLDO && po.TGLDO ? new Date(po.TGLDO) : new Date()} onChange={(e) => onInputChange(e, 'TGLDO')} id="tglDo" showIcon dateFormat="dd-mm-yy" />
                                    </div>
                                </div>
                                <div className="field col-12 mb-2 lg:col-4">
                                    <label htmlFor="tgl">Jatuh Tempo</label>
                                    <div className="p-inputgroup">
                                        <Calendar disabled={readOnlyEdit} value={po.JTHTMP && po.JTHTMP ? new Date(po.JTHTMP) : new Date()} onChange={(e) => onInputChange(e, 'JTHTMP')} id="jthtmp" showIcon dateFormat="dd-mm-yy" />
                                    </div>
                                </div>
                                <div className="field col-10 mb-2 lg:col-6">
                                    <label htmlFor="discount">Discount</label>
                                    <div className="p-inputgroup">
                                        <Checkbox readOnly={readOnlyEdit} style={{ marginRight: '10px' }} checked={checked} onChange={onCheckboxChange} />
                                        <InputNumber inputStyle={{ textAlign: 'right' }} readOnly={readOnlyEdit} value={po.PERSDISC} onChange={(e) => onInputNumberChange(e, 'PERSDISC')} required={checked} disabled={!checked} placeholder={checked ? 'Discount' : ''} />
                                        <Button icon="pi pi-percentage" className="p-button" readOnly />
                                    </div>
                                </div>
                                <div className="field col-2 mb-2 lg:col-6">
                                    <label htmlFor="ppn">Ppn</label>
                                    <div className="p-inputgroup">
                                        <Checkbox readOnly={readOnlyEdit} checked={checkedPpn} onChange={onCheckboxPpnChange} />
                                    </div>
                                </div>
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label htmlFor="fakturasli">Keterangan</label>
                                    <div className="p-inputgroup">
                                        {/* readOnly={readOnlyEdit} */}
                                        <InputText value={po.KETERANGAN} onChange={(e) => onInputChange(e, 'KETERANGAN')} autoFocus />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-6">
                            <div className="formgrid grid">
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label htmlFor="fakturasli">Faktur Asli</label>
                                    <div className="p-inputgroup">
                                        <InputText value={po.FAKTURASLI} onChange={(e) => onInputChange(e, 'FAKTURASLI')} required autoFocus />
                                    </div>
                                </div>
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label htmlFor="supplier">Supplier</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly value={supplierKode || po.SUPPLIER} />
                                        <Button icon="pi pi-search" className="p-button" onClick={btnSupplier} disabled={readOnlyEdit} />
                                        <InputText readOnly value={supplierNama || po.NAMA} />
                                    </div>
                                </div>
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label htmlFor="kota">Alamat</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly value={supplierAlamat || po.ALAMAT} />
                                    </div>
                                </div>
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label htmlFor="supplier">Barcode</label>
                                    <div className="p-inputgroup">
                                        <InputText id="barcode" onKeyDown={handleBarcodeKeyDown} />
                                        <Button icon="pi pi-search" className="p-button" onClick={btnProduk} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* {!isUpdateMode && ( */}
                <div className="my-2 text-right">
                    <Button label="Repeat PO" className="p-button-success p-button-sm mr-2" onClick={btnRepeat} disabled={isUpdateMode} />
                    <Button label="Reorder PO" className="p-button-success p-button-sm mr-2" onClick={btnReorder} disabled={isUpdateMode} />
                </div>
                {/*  )} */}
                <hr></hr>
                <DataTable
                    value={addPo}
                    size="small"
                    lazy
                    dataKey="KODE"
                    rows={10}
                    editMode="cell"
                    className="datatable-responsive editable-cells-table"
                    responsiveLayout="scroll"
                    first={lazyState.first}
                    totalRecords={totalRecords}
                    onPage={onPage}
                    loading={loading}
                    footerColumnGroup={footerGroup}
                    scrollable
                    scrollHeight="200px"
                    frozenFooter
                >
                    <Column headerStyle={{ textAlign: 'center' }} field="BARCODE" header="BARCODE"></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA"></Column>
                    <Column
                        field="QTY"
                        header="QTY"
                        body={(rowData) => {
                            const value = rowData.QTY ? parseInt(rowData.QTY).toLocaleString() : 0;
                            return value;
                        }}
                        editor={(options) => textEditor(options)}
                        onCellEditComplete={onCellEditComplete}
                    ></Column>
                    {/* <Column headerStyle={{ textAlign: "center" }} field="QTY" header="QTY" body={(rowData) => parseInt(rowData.QTY)} editor={(options) => cellEditor(options)} onCellEditComplete={onCellEditComplete}></Column> */}
                    <Column headerStyle={{ textAlign: 'center' }} field="SATUAN" header="SATUAN"></Column>
                    <Column
                        field="HARGABELI"
                        header="HARGA"
                        body={(rowData) => {
                            const value = rowData.HARGABELI ? parseInt(rowData.HARGABELI).toLocaleString() : 0;
                            return value;
                        }}
                        editor={(options) => textEditor(options)}
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
                    {/* <Column headerStyle={{ textAlign: "center" }} field="DISCOUNT" header="DISC%" editor={(options) => textEditor(options)} onCellEditComplete={onCellEditComplete} bodyStyle={{ textAlign: "center" }}></Column> */}
                    <Column
                        field="HARGADISCQTY"
                        header="DISCOUNT"
                        editor={(options) => textEditor(options)}
                        onCellEditComplete={onCellEditComplete}
                        body={(rowData) => formatRibuan(rowData.HARGADISCQTY)}
                    ></Column>
                    <Column
                        field="HARGAPPNQTY"
                        header="PPN"
                        editor={(options) => textEditor(options)}
                        onCellEditComplete={onCellEditComplete}
                        body={(rowData) => {
                            const value = rowData.HARGAPPNQTY ? parseInt(rowData.HARGAPPNQTY).toLocaleString() : 0;
                            return value;
                        }}
                    ></Column>
                    <Column
                        field="GRANDTOTAL"
                        header="GRAND TOTAL"
                        body={(rowData) => {
                            const value = rowData.GRANDTOTAL ? parseInt(rowData.GRANDTOTAL).toLocaleString() : 0;
                            return value;
                        }}
                    ></Column>
                    <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTabel} bodyStyle={{ textAlign: 'center' }}></Column>
                </DataTable>
                <br></br>
                <Toolbar className="mb-4" right={rightFooterTemplate}></Toolbar>
                <Supplier supplierDialog={supplierDialog} setSupplierDialog={setSupplierDialog} btnSupplier={btnSupplier} handleSupplierData={handleSupplierData} />
                <Produk produkDialog={produkDialog} setProdukDialog={setProdukDialog} btnProduk={btnProduk} handleProduk={handleProduk} />
            </div>
            <Repeat repeatDialog={repeatDialog} setRepeatDialog={setRepeatDialog} btnRepeat={btnRepeat} addPo={addPo} setAddPo={setAddPo} calculateUpdatedGrandTotalDisc={calculateUpdatedGrandTotalDisc} po={po} setPo={setPo} />
            <Reorder
                supplierKode={supplierKode}
                reorderDialog={reorderDialog}
                setReorderDialog={setReorderDialog}
                btnReorder={btnReorder}
                addPo={addPo}
                setAddPo={setAddPo}
                calculateUpdatedGrandTotalDisc={calculateUpdatedGrandTotalDisc}
                po={po}
                setPo={setPo}
            />
            ;{/* </div> */}
        </div>
    );
}

export default MasterAddPo;

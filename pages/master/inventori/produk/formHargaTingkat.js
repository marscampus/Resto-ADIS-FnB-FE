/**
     * Nama Program: GODONG POS - Master - Inventori Produk Form
     * Pengembang: Salsabila Emma
     * Tanggal Pengembangan: 4 April 2024
     * Versi: 1.1.0

    Catatan:
    - Versi 1.1.0 mencakup fungsionalitas Menu Inventori Produk Form
*/
import { useRouter } from 'next/router';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { RadioButton } from 'primereact/radiobutton';
import { TabPanel, TabView } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { classNames } from 'primereact/utils';
import React, { useEffect, useRef, useState } from 'react';
import { getYMD } from '../../../../component/GeneralFunction/GeneralFunction';
import CameraCapture from '../../../../component/captureCamera';
import postData from "../../../../lib/Axios";
import { getSessionServerSide } from "../../../../utilities/servertool";
import Golongan from "../../../component/golongan";
import Gudang from "../../../component/gudang";
import Produk from "../../../component/produk";
import Rak from "../../../component/rak";
import Satuan from "../../../component/satuan";
import Supplier from "../../../component/supplier";

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, '/master/inventori/produk');
    if (sessionData?.redirect) {
        return sessionData
    }
    // const { id } = context.params;
    return {
        props: {
            _A2F: context?.req?.cookies['_A2F']
        }
    }
}
const WIDTH = 500;
export default function addProduk() {
    const apiDirPath = '/api/api_crud_kode/';
    const apiEndPointGetKode = '/api/produk/get_kode';
    const apiEndPointStore = "/api/produk/store";
    const apiEndPointGetDataEdit = "/api/produk/getdata_edit";

    const router = useRouter();
    const toast = useRef(null);
    const [produk, setProduk] = useState([]);
    const [kadaluarsa, setKadaluarsa] = useState(false);
    const [satuan, setSatuan] = useState(null);
    const [stokAwal, setStokAwal] = useState([]);
    const [kode, setKode] = useState(null);

    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
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

    const [readOnlyEdit, setReadOnlyEdit] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    useEffect(() => {
        const { status } = router.query;
        const KODE = localStorage.getItem("KODE");
        if (status === "update") {
            setKode(KODE);
            fetchDataForEdit();
            setReadOnlyEdit(true);
            setIsUpdateMode(true); // Set state isUpdateMode to true
        } else {
            loadLazyData();
            setIsUpdateMode(false); // Set state isUpdateMode to false
        }
    }, [router.query]);

    const op = useRef(null);

    const fetchDataForEdit = async () => {
        const KODE = localStorage.getItem('KODE');
        setLoading(true);
        try {
            let requestBody = {
                KODE: KODE,
            };
            const vaTable = await postData(apiEndPointGetDataEdit, requestBody);
            const json = vaTable.data;
            const golongan = json.golongan;
            const gudang = json.gudang;
            const rak = json.rak;
            const supplier = json.supplier;
            const satuan = json.satuan;
            const satuan2 = json.satuan2;
            const satuan3 = json.satuan3;
            // return;
            setProduk(json);
            setGolonganKet(golongan.KETERANGAN);
            setRakKet(rak.KETERANGAN);
            setGudangKet(gudang.KETERANGAN);
            setSupplierNama(supplier.NAMA);
            setSatuanKeterangan(satuan.KETERANGAN);
            setSatuanKeterangan2(satuan2.KETERANGAN);
            setSatuanKeterangan3(satuan3.KETERANGAN);
        } catch (error) {
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };
    const toggleDataTable = async (event) => {
        // op.current.toggle(event);
        let indeks = null;
        let skipRequest = false;
        switch (event.index) {
            case 1:
                indeks = 2;
                detail !== null ? skipRequest = true : '';
                break;
            case 2:
                indeks = 3;
                satuan !== null ? skipRequest = true : '';
                break;
            case 3:
                indeks = 4;
                harga !== null ? skipRequest = true : '';
                break;
            case 4:
                indeks = 5;
                hargaPromo !== null ? skipRequest = true : '';
                break;
            default:
                indeks = 1;
                detail !== null ? skipRequest = true : '';
                break;
        }

        setActiveIndex(event.index ?? 0);
        setLoadingItem(true);
        // if(skipRequest === false){
        //     const resProduk = await dataTableProduk(indeks);
        //     updateStateProduk(indeks,resProduk);
        // }
        setLoadingItem(false);
    }
    const onPage = (event) => {
        setlazyState(event);
    };

    // ------------------------------------------------------------------< Multiple input Satuan >
    // -----------------------------------------------------------------------------------------------------------------< Satuan >
    const [satuanDialog, setSatuanDialog] = useState(false);
    const [satuanKode, setSatuanKode] = useState("");
    const [satuanKeterangan, setSatuanKeterangan] = useState("");
    const [satuanKeterangan2, setSatuanKeterangan2] = useState("");
    const [satuanKeterangan3, setSatuanKeterangan3] = useState("");
    const [activeSatuanIndex, setActiveSatuanIndex] = useState(0);
    const btnSatuan = (index) => {
        setActiveSatuanIndex(index);
        setSatuanDialog(true);
    };

    const handleSatuanData = (satuanKode, satuanKeterangan) => {
        setSatuanKode(satuanKode);
        setSatuanKeterangan(satuanKeterangan);
        // setProduk((prevProduk) => ({
        // 	...prevProduk,
        // 	GOLONGAN: golonganKode,
        // }));
    };
    const [satuanList, setSatuanList] = useState([{ id: 1, value: '', keterangan: '' }]);
    const handleInputChange = (index, field, value) => {
        const list = [...satuanList];
        list[index][field] = value;
        setSatuanList(list);
        const updatedProduk = { ...produk };
        if (index === 0) {
            updatedProduk.SATUAN = value;
        } else if (index === 1) {
            updatedProduk.SATUAN2 = value;
        } else if (index === 2) {
            updatedProduk.SATUAN3 = value;
        }
        setProduk(updatedProduk);
    };
    const handleAddInput = () => {
        // if (isUpdateMode) {
        //     // Edit mode
        //     let countToAdd = 0;
        //     // Periksa apakah SATUAN memiliki nilai
        //     if (produk.SATUAN) {
        //         countToAdd++;
        //     }
        //     // Periksa apakah SATUAN2 memiliki nilai
        //     if (produk.SATUAN2 && !produk.SATUAN3) {
        //         countToAdd++;
        //     }

        //     if (satuanList.length + countToAdd <= 3) { // Batasi hingga 3 input
        //         const newList = [...satuanList];
        //         for (let i = 0; i < countToAdd; i++) {
        //             newList.push({ id: newList.length + 1, value: '', keterangan: '' });
        //         }
        //         setSatuanList(newList);
        //     }
        // } else {
        // Add mode
        if (satuanList.length < 3) { // Batasi hingga 3 input
            const newList = [...satuanList];
            newList.push({ id: newList.length + 1, value: '', keterangan: '' });
            setSatuanList(newList);
        }
        // }

    };
    const handleRemoveInput = (index) => {
        const list = [...satuanList];
        list.splice(index, 1);
        setSatuanList(list);
    };

    // ----------------------------------------------------------------------------< Harga Beli >--
    const [hargaBeliList, setHargaBeliList] = useState([
        { id: 1, value: '', satuan: '' },
    ]);
    const handleInputChangeHB = (index, field, value) => {
        const list = [...hargaBeliList];
        list[index][field] = value;
        setHargaBeliList(list);

        // Update produk based on the active harga beli input
        const updatedProduk = { ...produk };
        if (index === 0) {
            updatedProduk.HB = value;
        } else if (index === 1) {
            updatedProduk.HB2 = value;
        } else if (index === 2) {
            updatedProduk.HB3 = value;
        }
        setProduk(updatedProduk);
    };
    const handleAddInputHB = () => {
        if (hargaBeliList.length < 3) {
            const newList = [...hargaBeliList];
            newList.push({ id: newList.length + 1, value: '', satuan: '' });
            setHargaBeliList(newList);
        }
    };
    const handleRemoveInputHB = (index) => {
        const newList = [...hargaBeliList];
        newList.splice(index, 1);
        setHargaBeliList(newList);
    };

    // -------------------------------------------------------------------------------< Harga Jual >--
    const [hargaJualList, setHargaJualList] = useState([
        { id: 1, value: '', satuan: '' },
    ]);
    const handleInputChangeHJ = (index, field, value) => {
        const list = [...hargaJualList];
        list[index][field] = value;
        setHargaJualList(list);

        // Update produk based on the active harga jual input
        const updatedProduk = { ...produk };
        if (index === 0) {
            updatedProduk.HJ = value;
        } else if (index === 1) {
            updatedProduk.HJ2 = value;
        } else if (index === 2) {
            updatedProduk.HJ3 = value;
        }
        setProduk(updatedProduk);
    };
    const handleAddInputHJ = () => {
        if (hargaJualList.length < 3) {
            const newList = [...hargaJualList];
            newList.push({ id: newList.length + 1, value: '', satuan: '' });
            setHargaJualList(newList);
        }
    };
    const handleRemoveInputHJ = (index) => {
        const newList = [...hargaJualList];
        newList.splice(index, 1);
        setHargaJualList(newList);
    };

    // ----------------------------------------------------------------------------------------------< Harga Tingkat >--
    const [tingkatHargaList, setTingkatHargaList] = useState([
        { id: 1, harga: '', qtyMin: '' },
    ]);

    const handleInputChangeTingkatHarga = (index, field, value) => {
        const list = [...tingkatHargaList];
        list[index][field] = value;
        setTingkatHargaList(list);
    };

    const handleAddInputTingkatHarga = () => {
        if (tingkatHargaList.length < 6) { // Maksimal 6 tingkat harga
            const newList = [...tingkatHargaList];
            newList.push({ id: newList.length + 1, harga: '', qtyMin: '' });
            setTingkatHargaList(newList);
        }
    };
    const handleRemoveInputTingkatHarga = (index) => {
        const newList = [...tingkatHargaList];
        newList.splice(index, 1);
        setTingkatHargaList(newList);
    };

    // ------------------------------------------------------------
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
            EXPIRED: selectedDate, // Memperbarui nilai produk.EXPIRED dengan tanggal yang dipilih
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
                EXPIRED: null,
            });
        }
        setCheckboxValue(selectedValue);
    };
    const handleCheckboxChange = (event) => {
        setStokAwal(event.target.checked);
    }

    // -----------------------------------------------------------------------------------------------------------------< Golongan >
    const [golonganDialog, setGolonganDialog] = useState(false);
    const [golonganKode, setGolonganKode] = useState("");
    const [golonganKet, setGolonganKet] = useState("");
    const btnGolongan = () => {
        setGolonganDialog(true);
    };
    const handleGolonganData = (golonganKode, golonganKet) => {
        setGolonganKode(golonganKode);
        setGolonganKet(golonganKet);
        setProduk((prevProduk) => ({
            ...prevProduk,
            GOLONGAN: golonganKode,
        }));
    };

    // -----------------------------------------------------------------------------------------------------------------< Rak >
    const [rakDialog, setRakDialog] = useState(false);
    const [rakKode, setRakKode] = useState("");
    const [rakKet, setRakKet] = useState("");
    const btnRak = () => {
        setRakDialog(true);
    };
    const handleRakData = (rakKode, rakKet) => {
        setRakKode(rakKode);
        setRakKet(rakKet);
        setProduk((prevProduk) => ({
            ...prevProduk,
            RAK: rakKode,
        }));
    };

    // -----------------------------------------------------------------------------------------------------------------< Gudang >
    const [gudangDialog, setGudangDialog] = useState(false);
    const [gudangKode, setGudangKode] = useState("");
    const [gudangKet, setGudangKet] = useState("");
    const btnGudang = () => {
        setGudangDialog(true);
    };
    const handleGudangData = (gudangKode, gudangKet) => {
        setGudangKode(gudangKode);
        setGudangKet(gudangKet);
        setProduk((prevProduk) => ({
            ...prevProduk,
            GUDANG: gudangKode,
        }));
    };

    // -----------------------------------------------------------------------------------------------------------------< Supplier >
    const [supplierDialog, setSupplierDialog] = useState(false);
    const [supplierKode, setSupplierKode] = useState("");
    const [supplierNama, setSupplierNama] = useState("");
    const btnSupplier = () => {
        setSupplierDialog(true);
    };
    const handleSupplierData = (supplierKode, supplierNama) => {
        setSupplierKode(supplierKode);
        setSupplierNama(supplierNama);
        setProduk((prevProduk) => ({
            ...prevProduk,
            SUPPLIER: supplierKode,
        }));
    };

    // -----------------------------------------------------------------------------------------------------------------< Image >
    const [selectedImageOption, setSelectedImageOption] = useState('u'); // Initial value is "upload"
    const [newImageUrl, setNewImageUrl] = useState(null);
    const [imageUrls, setImageUrls] = useState([]);
    const onImageChange = (event) => {
        setSelectedImageOption({
            ...selectedImageOption,
            image: event.target.value
        });
    };

    // ---------------------------------------------------------------- Drop Gambar

    const onUpload = () => {
        toast.current.show({ severity: 'info', summary: 'Success', detail: 'File Uploaded', life: 3000 });
    };

    const handleInputChangeImage = (event) => {
        const imageFile = event.target.files[0];

        const reader = new FileReader();

        reader.addEventListener('load', () => {
            const imageUrl = reader.result;

            const image = new Image();
            image.src = imageUrl;

            image.onload = (e) => {
                const canvas = document.createElement('canvas');
                const ratio = WIDTH / e.target.width;
                canvas.width = WIDTH;
                canvas.height = e.target.height * ratio;

                const context = canvas.getContext('2d');
                context.drawImage(image, 0, 0, canvas.width, canvas.height);

                const newImageUrl = context.canvas.toDataURL('image/jpeg', 90);

                setImageUrls((prevImageUrls) => [...prevImageUrls, newImageUrl]);
                setProduk((prevProduk) => ({
                    ...prevProduk,
                    FOTO: newImageUrl.split(',')[1],
                }));
            };
        });

        reader.readAsDataURL(imageFile);
    };
    const handleButtonClick = () => {
        document.getElementById('fileInput').click();
    };
    const handleDrop = (event) => {
        event.preventDefault();
        const imageFile = event.dataTransfer.files[0];

        const reader = new FileReader();

        reader.addEventListener('load', () => {
            const imageUrl = reader.result;

            const image = new Image();
            image.src = imageUrl;

            image.onload = (e) => {
                const canvas = document.createElement('canvas');
                const ratio = WIDTH / e.target.width;
                canvas.width = WIDTH;
                canvas.height = e.target.height * ratio;

                const context = canvas.getContext('2d');
                context.drawImage(image, 0, 0, canvas.width, canvas.height);

                const newImageUrl = context.canvas.toDataURL('image/jpeg', 90);

                setImageUrls((prevImageUrls) => [...prevImageUrls, newImageUrl]);
                setProduk((prevProduk) => ({
                    ...prevProduk,
                    FOTO: newImageUrl.split(',')[1],
                }));
            };
        });

        reader.readAsDataURL(imageFile);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    // ----------------------------------------------------------------
    const webcamRef = useRef(null);
    const [image, setImage] = useState('');
    const capture = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        setImage(imageSrc);
    };

    // -----------------------------------------------------------------------------------------------------------------< PRODUK / BARCODE >
    const [produkDialog, setProdukDialog] = useState(false);
    const [produkKode, setProdukKode] = useState("");
    const [produkNama, setProdukNama] = useState("");
    const btnProduk = () => {
        setProdukDialog(true);
    };
    const handleProdukData2 = (produkKode, produkNama) => {
        setProdukKode(produkKode);
        setProdukNama(produkNama);
        // onRowSelectBarcode({data: {KODE_TOKO: produkFaktur}});
        setProduk((prevProduk) => ({
            ...prevProduk,
            NAMA: produkNama,
        }));
    };

    const loadLazyData = async () => {
        // setLoading(true);
        try {
            let requestBody = {
                KODE: "STK",
                LEN: 10
            };
            const vaTable = await postData(apiEndPointGetKode, requestBody);
            const json = vaTable.data;
            setTotalRecords(json.total);
            setKode(json);
            setProduk((prevProduk) => ({
                ...prevProduk,
                KODE: json,
            }));
        } catch (error) {
            console.error('Error while loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const convertUndefinedToNull = (obj) => {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    convertUndefinedToNull(obj[key]); // Memanggil fungsi rekursif jika nilai properti adalah objek
                } else if (obj[key] === undefined) {
                    obj[key] = null; // Mengubah nilai undefined menjadi null
                }
            }
        }
    };
    const createDataObject = (_produk) => {
        const data = {
            KODE: _produk.KODE,
            KODE_TOKO: _produk.KODE_TOKO,
            NAMA: _produk.NAMA,
            JENIS: _produk.JENIS,
            GOLONGAN: _produk.GOLONGAN,
            RAK: _produk.RAK,
            GUDANG: _produk.GUDANG,
            SUPPLIER: _produk.SUPPLIER || supplierKode,
            EXPIRED: getYMD(_produk.EXPIRED || new Date()),
            BERAT: _produk.BERAT,
            DOS: _produk.DOS,
            SATUAN: _produk.SATUAN, SATUAN2: _produk.SATUAN2 || '', SATUAN3: _produk.SATUAN3 || '',
            ISI: _produk.ISI, ISI2: _produk.ISI2 || 0,
            DISCOUNT: _produk.DISCOUNT,
            PAJAK: _produk.PAJAK,
            MIN: _produk.MIN,
            MAX: _produk.MAX,
            HB: _produk.HB, HB2: _produk.HB2 || 0, HB3: _produk.HB3 || 0,
            HJ: _produk.HJ, HJ2: _produk.HJ2 || 0, HJ3: _produk.HJ3 || 0,
            HJ_TINGKAT1: _produk.HJ_TINGKAT, HJ_TINGKAT2: _produk.HJ_TINGKAT2 || 0, HJ_TINGKAT3: _produk.HJ_TINGKAT3 || 0, HJ_TINGKAT4: _produk.HJ_TINGKAT4 || 0, HJ_TINGKAT5: _produk.HJ_TINGKAT5 || 0, HJ_TINGKAT6: _produk.HJ_TINGKAT6 || 0,
            MIN_TINGKAT1: _produk.MIN_TINGKAT, MIN_TINGKAT2: _produk.MIN_TINGKAT2 || 0, MIN_TINGKAT3: _produk.MIN_TINGKAT3 || 0, MIN_TINGKAT4: _produk.MIN_TINGKAT4 || 0, MIN_TINGKAT5: _produk.MIN_TINGKAT5 || 0, MIN_TINGKAT6: _produk.MIN_TINGKAT6 || 0,

            FOTO: _produk.FOTO,
            // FOTO: newImageUrl.split(',')[1],
        };
        convertUndefinedToNull(data);
        return data;
    };

    const saveProduk = async (e) => {
        e.preventDefault();
        let _produk = { ...produk };
        let _data = createDataObject(_produk);
        try {
            const vaTable = await postData(apiEndPointStore, _data);
            let data = vaTable.data;
            showSuccess(toast, data?.message)
            router.push('/master/inventori/produk');
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    }
    // ------------------------------------------------------------------------------------------------------ button
    const produkFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={() => { router.push('/master/inventori/produk'); }} />
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveProduk} />
        </>
    );

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>{isUpdateMode ? "Edit" : "Add"} Produk</h4><hr />
                    <Toast ref={toast} />
                    <TabView activeIndex={activeIndex} onTabChange={toggleDataTable}>
                        <TabPanel header="Detail Item">
                            <div>
                                <div className="formgrid grid">
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="kode">Kode</label>
                                        <div className="p-inputgroup">
                                            {/* <InputText readOnly id="kode" value={kode} onChange={(e) => onInputChange(e, 'KODE')}  /> */}
                                            <InputText readOnly value={isUpdateMode ? produk.KODE : kode} />
                                        </div>
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="barcode">Barcode</label>
                                        <div className="p-inputgroup">
                                            <InputText id="barcode" value={produk.KODE_TOKO} onChange={(e) => onInputChange(e, 'KODE_TOKO')} />
                                        </div>
                                    </div>
                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="namaproduk">Nama Produk</label>
                                        <div className="p-inputgroup">
                                            <InputText id="namaProduk" value={produk.NAMA || produkNama} onChange={(e) => onInputChange(e, 'NAMA')} />
                                            <Button icon="pi pi-search" className="p-button" onClick={btnProduk} />
                                        </div>
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label className="mb-3">Jenis</label>
                                        <div className="p-inputgroup">
                                            {/* <div className="formgrid grid"> */}
                                            <div className="field-radiobutton col-6">
                                                <RadioButton inputId="jenis_barang" name="jenis" value="b" onChange={onJenisChange} checked={produk.JENIS === 'b'} />
                                                <label htmlFor="jenis_barang">Barang</label>
                                            </div>
                                            <div className="field-radiobutton col-6">
                                                <RadioButton inputId="jenis_jasa" name="jenis" value="j" onChange={onJenisChange} checked={produk.JENIS === 'j'} />
                                                <label htmlFor="jenis_jasa">Jasa</label>
                                            </div>
                                            {/* </div> */}
                                        </div>
                                    </div>
                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="golongan">Golongan</label>
                                        <div className="p-inputgroup">
                                            <InputText readOnly value={golonganKode || produk.GOLONGAN} />
                                            <Button icon="pi pi-search" className="p-button" onClick={btnGolongan} />
                                            {/* disabled={readOnlyEdit} */}
                                            <InputText readOnly value={golonganKet} />
                                        </div>
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="rak">Rak</label>
                                        <div className="p-inputgroup">
                                            <InputText readOnly value={rakKode || produk.RAK} />
                                            <Button icon="pi pi-search" className="p-button" onClick={btnRak} />
                                            {/* disabled={readOnlyEdit} */}
                                            <InputText readOnly value={rakKet} />
                                        </div>
                                    </div>
                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="gudang">Gudang</label>
                                        <div className="p-inputgroup">
                                            <InputText readOnly value={gudangKode || produk.GUDANG} />
                                            <Button icon="pi pi-search" className="p-button" onClick={btnGudang} />
                                            {/* disabled={readOnlyEdit} */}
                                            <InputText readOnly value={gudangKet} />
                                        </div>
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="supplier">Supplier</label>
                                        <div className="p-inputgroup">
                                            <InputText readOnly value={produk.SUPPLIER || supplierKode} />
                                            <Button icon="pi pi-search" className="p-button" onClick={btnSupplier} />
                                            <InputText readOnly value={supplierNama} />
                                        </div>
                                    </div>
                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="kadaluarsa">Tanggal Kadaluarsa</label>
                                        <div className="formgrid grid">
                                            <div className="field col-8 mb-2 lg:col-8">
                                                {!produk.TIDAKEXPIRED && (
                                                    <div className="p-inputgroup">
                                                        <Calendar
                                                            id="kadaluarsa"
                                                            value={produk.EXPIRED}
                                                            onChange={onDateChange}
                                                            showIcon
                                                            disabled={!isChecked}
                                                            dateFormat="dd-mm-yy"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="field col-4 mb-2 lg:col-4">
                                                <div className="p-field-checkbox">
                                                    <div className="p-inputgroup mt-2">
                                                        <Checkbox
                                                            inputId="kadaluarsa"
                                                            name="kadaluarsa"
                                                            value="Kadaluarsa"
                                                            checked={checkboxValue.indexOf('Kadaluarsa') !== -1}
                                                            onChange={onCheckboxChange}
                                                        />
                                                        <label className="ml-2"> Tidak Ada</label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="berat">Berat</label>
                                        <div className="p-inputgroup">
                                            <InputText id="berat"
                                                mode="decimal" minFractionDigits={2} maxFractionDigits={5}
                                                value={produk.BERAT} onChange={(e) => onInputChange(e, 'BERAT')}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabPanel>
                        <TabPanel header="Satuan">
                            <div>
                                <div className="formgrid grid">
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="kemasan">Kemasan</label>
                                        <div className="p-inputgroup">
                                            <div className="field-radiobutton col-4">
                                                <RadioButton inputId="kemasan1" name="kemasan" value="1" onChange={onKemasanChange} checked={produk.DOS === '1'} />
                                                <label htmlFor="kemasan1">1 Kemasan</label>
                                            </div>
                                            <div className="field-radiobutton col-4">
                                                <RadioButton inputId="kemasan2" name="kemasan" value="2" onChange={onKemasanChange} checked={produk.DOS === '2'} />
                                                <label htmlFor="kemasan2">2 Kemasan</label>
                                            </div>
                                            <div className="field-radiobutton col-4">
                                                <RadioButton inputId="kemasan3" name="kemasan" value="3" onChange={onKemasanChange} checked={produk.DOS === '3'} />
                                                <label htmlFor="kemasan3">3 Kemasan</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="field col-6 mb-2 lg:col-6">
                                        <div className="p-field-checkbox">
                                            <label> Stok Awal </label>
                                            <div className="p-inputgroup mt-2">
                                                <Checkbox
                                                    inputId="kadaluarsa"
                                                    name="kadaluarsa"
                                                    value="Kadaluarsa"
                                                    checked={stokAwal}
                                                    onChange={handleCheckboxChange}
                                                />
                                                {stokAwal && (
                                                    <div className="field col-10 mb-2 lg:col-10">
                                                        <div className="p-inputgroup">
                                                            <InputText id="stok-awal" value={produk.QTY} onChange={(e) => onInputChange(e, 'QTY')} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    {satuanList.map((satuan, index) => (
                                        <div key={index} className="formgrid grid">
                                            <div className="field col-12 mb-2 lg:col-12">
                                                <label htmlFor={`satuan${index + 1}`}>Satuan {index + 1}</label>
                                                <div className="p-inputgroup">
                                                    <InputText
                                                        id={`satuan${index + 1}`}
                                                        onChange={(e) => handleInputChange(index, 'value', e.value)}
                                                        // value={index === 0 ? produk.SATUAN : index === 1 ? produk.SATUAN2 : produk.SATUAN3}
                                                        // value={satuan.value}
                                                        value={isUpdateMode ? (index === 0 ? produk.SATUAN : index === 1 ? produk.SATUAN2 : produk.SATUAN3) : satuanKode}
                                                    />
                                                    <Button
                                                        icon="pi pi-search"
                                                        className="p-button"
                                                        onClick={() => btnSatuan(index)}
                                                    />
                                                    <InputText
                                                        readOnly
                                                        id={`ket-Satuan${index + 1}`}
                                                        // value={index === 0 ? satuanKeterangan : index === 1 ? satuanKeterangan2 : satuanKeterangan3}
                                                        // value={satuan.keterangan}
                                                        value={isUpdateMode ? (index === 0 ? satuanKeterangan : index === 1 ? satuanKeterangan2 : satuanKeterangan3) : satuan.keterangan}
                                                    />
                                                    {satuanList.length > 1 && (
                                                        <Button
                                                            icon="pi pi-times"
                                                            className="p-button-danger p-button-rounded p-button-text"
                                                            onClick={() => handleRemoveInput(index)}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {satuanList.length < 3 && (
                                        <Button icon="pi pi-plus" label="Tambah Satuan" className="p-button p-button-text" onClick={handleAddInput} />
                                    )}
                                </div>
                            </div>
                        </TabPanel>
                        <TabPanel header="Harga">
                            <div>
                                <div className="formgrid grid">
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <div className="formgrid grid">
                                            <div className="field col-12 mb-2 lg:col-6">
                                                <label htmlFor="isi1">Isi 1</label>
                                                <div className="p-inputgroup">
                                                    <InputText id="isi1" value={produk.ISI} onChange={(e) => onInputChange(e, 'ISI')} />
                                                </div>
                                            </div>
                                            <div className="field col-12 mb-2 lg:col-6">
                                                <label htmlFor="isi2">Isi 2</label>
                                                <div className="p-inputgroup">
                                                    <InputText id="isi2" value={produk.ISI2} onChange={(e) => onInputChange(e, 'ISI2')} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <div className="formgrid grid">
                                            <div className="field col-12 mb-2 lg:col-6">
                                                <label htmlFor="min-stock">Minimal Stok</label>
                                                <div className="p-inputgroup">
                                                    <InputText id="min-stock" value={produk.MIN} onChange={(e) => onInputChange(e, 'MIN')} className={classNames({ 'p-invalid': submitted && !produk.MIN })} />
                                                    <span className="p-inputgroup-addon">
                                                        {produk.SATUAN ? produk.SATUAN : '-'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="field col-12 mb-2 lg:col-6">
                                                <label htmlFor="max-stok">Maximal Stok</label>
                                                <div className="p-inputgroup">
                                                    <InputText id="max-stok" value={produk.MAX} onChange={(e) => onInputChange(e, 'MAX')} className={classNames({ 'p-invalid': submitted && !produk.MAX })} />
                                                    <span className="p-inputgroup-addon">
                                                        {produk.SATUAN ? produk.SATUAN : '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>


                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <label htmlFor="diskon">Diskon</label>
                                        <div className="p-inputgroup">
                                            <InputText id="diskon" value={produk.DISCOUNT} onChange={(e) => onInputChange(e, 'DISCOUNT')} />
                                            <Button icon="pi pi-percentage" className="p-button" readOnly />
                                        </div>
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <label htmlFor="isi2">Pajak</label>
                                        <div className="p-inputgroup">
                                            <InputText id="pajak" value={produk.PAJAK} onChange={(e) => onInputChange(e, 'PAJAK')} />
                                            <Button icon="pi pi-percentage" className="p-button" readOnly />
                                        </div>
                                    </div>
                                </div>
                                <div className="formgrid grid">
                                    <div className="field col-12 mb-2 lg:col-6">
                                        {hargaBeliList.map((hargaBeli, index) => (
                                            <div className="formgrid grid">
                                                <div key={index} className="field col-12 mb-2 lg:col-12">
                                                    <label htmlFor={`harga-beli${index + 1}`}>Harga Beli {index + 1}</label>
                                                    <div className="p-inputgroup">
                                                        <InputNumber
                                                            id={`harga-beli${index + 1}`}
                                                            // value={hargaBeli.value}
                                                            value={isUpdateMode ? (index === 0 ? produk.HB : index === 1 ? produk.HB2 : produk.HB3) : hargaBeli.value}
                                                            onChange={(e) => handleInputChangeHB(index, 'value', e.value)}
                                                            inputStyle={{ textAlign: 'right' }}
                                                        />
                                                        <span className="p-inputgroup-addon">
                                                            {/* {hargaBeli.satuan ? hargaBeli.satuan : '-'} */}
                                                            {isUpdateMode ? (index === 0 ? produk.SATUAN : index === 1 ? produk.SATUAN2 : produk.SATUAN3) : hargaBeli.satuan}
                                                        </span>
                                                        {hargaBeliList.length > 1 && (
                                                            <Button icon="pi pi-times" className="p-button-danger p-button-text" onClick={() => handleRemoveInputHB(index)} />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {hargaBeliList.length < 3 && (
                                            <Button icon="pi pi-plus" label="Tambah HB" className="p-button p-button-text" onClick={handleAddInputHB} />
                                        )}
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-6">
                                        {hargaJualList.map((hargaJual, index) => (
                                            <div className="formgrid grid">
                                                <div key={index} className="field col-12 mb-2 lg:col-12">
                                                    <label htmlFor={`harga-jual${index + 1}`}>Harga Jual {index + 1}</label>
                                                    <div className="p-inputgroup">
                                                        <InputNumber
                                                            id={`harga-jual${index + 1}`}
                                                            // value={hargaJual.value}
                                                            value={isUpdateMode ? (index === 0 ? produk.HJ : index === 1 ? produk.HJ2 : produk.HJ3) : hargaJual.value}
                                                            onChange={(e) => handleInputChangeHJ(index, 'value', e.value)}
                                                            inputStyle={{ textAlign: 'right' }}
                                                        />
                                                        <span className="p-inputgroup-addon">
                                                            {/* {hargaJual.satuan ? hargaJual.satuan : '-'} */}
                                                            {isUpdateMode ? (index === 0 ? produk.SATUAN : index === 1 ? produk.SATUAN2 : produk.SATUAN3) : hargaJual.satuan}
                                                        </span>
                                                        {hargaJualList.length > 1 && (
                                                            <Button icon="pi pi-times" className="p-button-danger p-button-text" onClick={() => handleRemoveInputHJ(index)} />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {hargaJualList.length < 3 && (
                                            <Button icon="pi pi-plus" label="Tambah HJ" className="p-button p-button-text" onClick={handleAddInputHJ} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabPanel>
                        <TabPanel header="Harga Promo">
                            <div>
                                <div class="grid formgrid">
                                    <div className="field col-12 mb-2 lg:col-2">
                                        {/* <p className="p-inputgroup-addon" style={{marginTop:'25px'}}></p> */}
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <label htmlFor="harga-jual">Harga Jual</label>
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-4">
                                        <label htmlFor="qtyMin">QTY Min</label>
                                    </div>
                                </div>
                                {tingkatHargaList.map((tingkatHarga, index) => (
                                    <div key={index}>
                                        <div className="grid formgrid">
                                            <div className="field col-2 mb-2 lg:col-2">
                                                <p className="p-inputgroup-addon">Tingkat {index + 1}</p>
                                            </div>
                                            <div className="field col-6 mb-2 lg:col-6">
                                                <div className="p-inputgroup">
                                                    <InputNumber
                                                        id={`harga-tingkat${index + 1}`}
                                                        // value={tingkatHarga.harga}
                                                        value={isUpdateMode ? (
                                                            index === 0 ? produk.HJ_TINGKAT1 :
                                                                index === 1 ? produk.HJ_TINGKAT2 :
                                                                    index === 2 ? produk.HJ_TINGKAT3 :
                                                                        index === 3 ? produk.HJ_TINGKAT4 :
                                                                            index === 4 ? produk.HJ_TINGKAT5 :
                                                                                index === 5 ? produk.HJ_TINGKAT6 :
                                                                                    produk.HJ_TINGKAT7
                                                        ) : tingkatHarga.harga}
                                                        onChange={(e) => handleInputChangeTingkatHarga(index, 'harga', e.value)}
                                                        // mode="currency"
                                                        // currency="IDR"
                                                        // locale="id-ID"
                                                        inputStyle={{ textAlign: 'right' }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="field col-4 mb-2 lg:col-4">
                                                <div className="p-inputgroup">
                                                    <InputText
                                                        id={`qty-min${index + 1}`}
                                                        // value={tingkatHarga.qtyMin}
                                                        value={isUpdateMode ? (
                                                            index === 0 ? produk.MIN_TINGKAT1 :
                                                                index === 1 ? produk.MIN_TINGKAT2 :
                                                                    index === 2 ? produk.MIN_TINGKAT3 :
                                                                        index === 3 ? produk.MIN_TINGKAT4 :
                                                                            index === 4 ? produk.MIN_TINGKAT5 :
                                                                                index === 5 ? produk.MIN_TINGKAT6 :
                                                                                    produk.MIN_TINGKAT7
                                                        ) : tingkatHarga.qtyMin}
                                                        onChange={(e) => handleInputChangeTingkatHarga(index, 'qtyMin', e.target.value)}
                                                    />
                                                    {tingkatHargaList.length > 1 && (
                                                        <Button icon="pi pi-times" className="p-button-danger p-button-text" onClick={() => handleRemoveInputTingkatHarga(index)} />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {tingkatHargaList.length < 6 && (
                                    <Button icon="pi pi-plus" className="p-button-secondary p-button-text" onClick={handleAddInputTingkatHarga} />
                                )}
                            </div>
                        </TabPanel>
                        <TabPanel header="Upload Image">
                            <div>
                                <div className="grid formgrid">
                                    <div className="field-radiobutton col-12 mb-2 lg:col-12">
                                        <RadioButton inputId="upload_gambar" name="image" value="u" onChange={onImageChange} checked={selectedImageOption.image === 'u'} />
                                        <label htmlFor="">Upload Gambar :</label>
                                    </div>
                                    <div className="col-12 mb-2 lg:col-12" style={{ paddingBottom: '20px' }}>
                                        {selectedImageOption.image === 'u' && (
                                            <>
                                                <div
                                                    id="dropArea"
                                                    onDrop={handleDrop}
                                                    onDragOver={handleDragOver}
                                                    style={{
                                                        width: '100%',
                                                        height: '200px',
                                                        border: '3px dashed #ccc',
                                                        textAlign: 'center',
                                                        paddingTop: '80px',
                                                        marginTop: '10px',
                                                        marginBottom: '20px',
                                                        borderRadius: '20px'
                                                    }}
                                                >
                                                    <input id="fileInput" type="file" style={{ display: 'none' }} accept=".jpg, .jpeg, .png" onChange={handleInputChangeImage} />
                                                    <Button label="Pilih atau Drop File Gambar Disini" icon="pi pi-upload" style={{ marginLeft: '20px', marginRight: '10px', borderRadius: '20px' }} onClick={handleButtonClick} />
                                                </div>
                                                <div>Preview Gambar :</div>
                                            </>
                                        )}

                                        <div style={{ paddingTop: '20px' }}>
                                            {imageUrls.map((url, index) => (
                                                <div key={index} className="field-wrapper col-100 mb-100 lg:col-100" id={`wrapper-${index}`}>
                                                    <img src={url} alt={`Gambar ${index}`} width={200} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid formgrid">
                                    <div className="field-radiobutton col-12 mb-2 lg:col-12">
                                        <RadioButton inputId="capture_gambar" name="image" value="c" onChange={onImageChange} checked={selectedImageOption.image === 'c'} />
                                        <label htmlFor="">Ambil Gambar :</label>
                                    </div>
                                    <div style={{ paddingTop: '20px' }}>
                                        {selectedImageOption.image === 'c' && (
                                            <div>
                                                {image && <img src={image} alt="captured" />}
                                                <CameraCapture />
                                                {/* <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" width="80%" />
                                                <Button label="Screenshoot" icon="pi pi-camera" style={{ marginLeft: '20px' }} onClick={capture} /> */}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabPanel>
                    </TabView>
                    <Toolbar className="mb-4" right={produkFooter}></Toolbar>
                    <Rak rakDialog={rakDialog} setRakDialog={setRakDialog} btnRak={btnRak} handleRakData={handleRakData} />
                    <Gudang gudangDialog={gudangDialog} setGudangDialog={setGudangDialog} btnGudang={btnGudang} handleGudangData={handleGudangData} />
                    <Supplier supplierDialog={supplierDialog} setSupplierDialog={setSupplierDialog} btnSupplier={btnSupplier} handleSupplierData={handleSupplierData} />
                    <Satuan setProduk={setProduk} produk={produk} activeSatuanIndex={activeSatuanIndex} setActiveSatuanIndex={setActiveSatuanIndex} satuanList={satuanList} setSatuanList={setSatuanList} satuanDialog={satuanDialog} setSatuanDialog={setSatuanDialog} btnSatuan={btnSatuan} handleSatuanData={handleSatuanData} />
                    <Golongan golonganDialog={golonganDialog} setGolonganDialog={setGolonganDialog} btnGolongan={btnGolongan} handleGolonganData={handleGolonganData} />
                    <Produk produkDialog={produkDialog} setProdukDialog={setProdukDialog} btnProduk={btnProduk} handleProdukData2={handleProdukData2} />
                </div>
            </div>
        </div>

    )
}
// export default AddPage;

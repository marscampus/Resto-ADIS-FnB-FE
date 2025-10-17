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
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { getYMD, showError, showSuccess } from '../../../../component/GeneralFunction/GeneralFunction';
import CameraCapture from '../../../../component/captureCamera';
import postData from '../../../../lib/Axios';
import { getSessionServerSide } from '../../../../utilities/servertool';
import Golongan from '../../../component/golongan';
import Gudang from '../../../component/gudang';
import Rak from '../../../component/rak';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import Supplier from '../../../component/supplier';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, '/master/inventori/bahan_baku');
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {
            _A2F: context?.req?.cookies['_A2F']
        }
    };
}
const WIDTH = 500;
export default function addProduk() {
    const apiEndPointGetKode = '/api/produk/get_kode';
    const apiEndPointStore = '/api/bahan-baku/store';
    const apiEndPointUpdate = '/api/bahan-baku/update';
    const apiEndPointGetDataEdit = '/api/bahan-baku/getdata_edit';
    const apiEndPointGetSatuan = '/api/satuan_stock/get';

    const router = useRouter();
    const toast = useRef(null);
    // const [produk, setProduk] = useState([]);
    const [produk, setProduk] = useState({
        PAJAK: false, // Default value untuk PAJAK adalah false
        BKP: '0', // Default value untuk BKP adalah "0"
        JENIS: 'B'
    });
    const [variant, setVariant] = useState([]);
    const [variantInputs, setVariantInputs] = useState({
        TIPE_VARIANT: '',
        VARIANT: '',
        BARCODE_VARIANT: '',
        HARGA_BELI_VARIANT: 0,
        HARGA_JUAL_VARIANT: 0
    });
    const [kadaluarsa, setKadaluarsa] = useState(false);
    const [satuan, setSatuan] = useState(null);
    const [stokAwal, setStokAwal] = useState(false);
    const [kode, setKode] = useState(null);
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [checkboxValue, setCheckboxValue] = useState([]);
    const [isChecked, setIsChecked] = useState(false);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [search, setSearch] = useState('');
    const [loadingSatuan, setLoadingSatuan] = useState(false);
    const [satuanTabel, setSatuanTabel] = useState([]);
    const [satuanTabelFilt, setSatuanTabelFilt] = useState([]);
    const [totalRecordsSatuan, setTotalRecordsSatuan] = useState(0);
    const [readOnlyEdit, setReadOnlyEdit] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    useEffect(() => {
        const { status } = router.query;
        const KODE = localStorage.getItem('KODE');
        if (status === 'update') {
            setKode(KODE);
            fetchDataForEdit();
            setReadOnlyEdit(true);
            setIsUpdateMode(true); // Set state isUpdateMode to true
            setIsImageUploaded(true);
        } else {
            loadLazyData();
            setIsUpdateMode(false); // Set state isUpdateMode to false
        }
    }, []);
    // router.query

    const op = useRef(null);

    const fetchDataForEdit = async () => {
        const KODE = localStorage.getItem('KODE');
        setLoading(true);
        try {
            let requestBody = { Kode: KODE };
            const vaTable = await postData(apiEndPointGetDataEdit, requestBody);
            const json = vaTable.data;
            setProduk(json.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const onPage = (event) => {
        // Set lazyState from event
        setlazyState(event);

        // Ensure filters remain as strings if they are objects
        if (event.filters) {
            Object.keys(event.filters).forEach((key) => {
                const filterValue = event.filters[key];
                if (typeof filterValue === 'object' && !Array.isArray(filterValue)) {
                    const stringValue = Object.values(filterValue).join('');
                    event.filters[key] = stringValue;
                }
            });
        }
        // Set first and rows for pagination
        setFirst(event.first);
        setRows(event.rows);

        // Load data with updated lazyState
        loadLazyData();
    };


    // ------------------------------------------------------------------< Multiple input Satuan >
    // -----------------------------------------------------------------------------------------------------------------< Satuan >
    useEffect(() => {
        setSatuanTabelFilt(satuanTabel);
    }, [satuanTabel, lazyState]);
    const [satuanDialog, setSatuanDialog] = useState(false);
    const headerSatuan = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"> </h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => filterPlugins('search', e.target.value)} placeholder="Search..." value={search} />
                </span>
            </div>
        </div>
    );

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = satuanTabel.filter((d) => (x ? x.test(d.KODE) || x.test(d.KETERANGAN) : []));
            setSearch(searchVal);
        }

        setSatuanTabelFilt(filtered);
    };

    const btnSatuan = async (event) => {
        setLoadingSatuan(true);
        try {
            const vaTable = await postData(apiEndPointGetSatuan, lazyState);
            const json = vaTable.data;
            setTotalRecords(json.total);
            setSatuanTabel(json.data);
            setSatuanDialog(true);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoadingSatuan(false);
        }
        setLoadingSatuan(false);
    };

    const onRowSelectSatuan = (event) => {
        const selectedKode = event.data.KODE;
        const selectedSatuan = satuanTabel.find((satuan) => satuan.KODE === selectedKode);
        setProduk((prevBahanBaku) => ({
            ...prevBahanBaku,
            SATUAN: selectedSatuan.KODE,
            KETSATUAN: selectedSatuan.KETERANGAN
        }))
        setSatuanDialog(false);
    };

    const [satuanList, setSatuanList] = useState([{ id: 1, value: '', keterangan: '' }]);
    const handleInputChange = (index, field, value) => {
        const list = [...satuanList];
        list[index][field] = value;
        setSatuanList(list);

        const updatedProduk = { ...produk };
        if (index === 0) {
            updatedProduk.Satuan = list[0].value;
            updatedProduk.KetSatuan1 = list[0].keterangan;
        } else if (index === 1) {
            updatedProduk.Satuan2 = list[1].value;
            updatedProduk.KetSatuan2 = list[1].keterangan;
        } else if (index === 2) {
            updatedProduk.Satuan3 = list[2].value;
            updatedProduk.KetSatuan3 = list[2].keterangan;
        }
        setProduk(updatedProduk);
    };

    const handleAddInput = () => {
        if (satuanList.length < 3) {
            const newList = [...satuanList];
            newList.push({ id: newList.length + 1, value: '', keterangan: '' });
            setSatuanList(newList);
        }
    };

    const handleRemoveInput = (index) => {
        const list = [...satuanList];
        list.splice(index, 1);
        setSatuanList(list);

        const updatedProduk = { ...produk };
        if (index === 0) {
            updatedProduk.Satuan = list[0] ? list[0].value : '';
            updatedProduk.KetSatuan1 = list[0] ? list[0].keterangan : '';
        } else if (index === 1) {
            updatedProduk.Satuan2 = list[1] ? list[1].value : '';
            updatedProduk.KetSatuan2 = list[1] ? list[1].keterangan : '';
        } else if (index === 2) {
            updatedProduk.Satuan3 = list[2] ? list[2].value : '';
            updatedProduk.KetSatuan3 = list[2] ? list[2].keterangan : '';
        }
        setProduk(updatedProduk);
    };

    // ----------------------------------------------------------------------------< Harga Beli >--
    // ----------------------------------------------------------------------------------------------< Harga Tingkat >--
    const [tingkatHargaList, setTingkatHargaList] = useState([{ id: 1, harga: '', qtyMin: '' }]);

    const handleInputChangeTingkatHarga = (index, field, value) => {
        const list = [...tingkatHargaList];
        list[index][field] = value;
        setTingkatHargaList(list);
    };

    const handleAddInputTingkatHarga = () => {
        if (tingkatHargaList.length < 6) {
            // Maksimal 6 tingkat harga
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
    const onInputChangeBkp = (e, name) => {
        const checked = e.checked;
        setProduk((prevState) => ({
            ...prevState,
            [name]: checked, // Update nilai PAJAK
            BKP: checked ? '1' : '0' // Update nilai BKP berdasarkan nilai PAJAK
        }));
    };

    const onInputNumberChange = (e, field) => {
        const val = e.value || 0;
        setProduk({
            ...produk,
            [field]: val
        });
    };

    const onJenisChange = (e) => {
        setProduk({
            ...produk,
            JENIS: e.value
        });
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

    const onInputChangeCheck = (e, field) => {
        const val = (e.target && e.target.value) || '';
        let _produk = { ...produk };
        _produk[`${name}`] = val;
        setProduk(_produk);
    };

    const handleCheckboxChange = (e) => {
        setStokAwal(e.checked);
        if (!e.checked) {
            // If checkbox is unchecked, set StockAwal to 0
            onInputChangeCheck({ target: { value: 0 } }, 'STOCKAWAL');
        }
    };

    // -----------------------------------------------------------------------------------------------------------------< Golongan >
    const [golonganDialog, setGolonganDialog] = useState(false);
    const [golonganKode, setGolonganKode] = useState('');
    const [golonganKet, setGolonganKet] = useState('');
    const btnGolongan = () => {
        setGolonganDialog(true);
    };
    const handleGolonganData = (golonganKode, golonganKet) => {
        setProduk((prevProduk) => ({
            ...prevProduk,
            GOLONGAN: golonganKode,
            KETGOLONGAN: golonganKet
        }));
    };

    // -----------------------------------------------------------------------------------------------------------------< Rak >
    const [rakDialog, setRakDialog] = useState(false);
    const [rakKode, setRakKode] = useState('');
    const [rakKet, setRakKet] = useState('');
    const btnRak = () => {
        setRakDialog(true);
    };
    const handleRakData = (rakKode, rakKet) => {
        setProduk((prevProduk) => ({
            ...prevProduk,
            RAK: rakKode,
            KETRAK: rakKet
        }));
    };

    // -----------------------------------------------------------------------------------------------------------------< Gudang >
    const [gudangDialog, setGudangDialog] = useState(false);
    const [gudangKode, setGudangKode] = useState('');
    const [gudangKet, setGudangKet] = useState('');
    const btnGudang = () => {
        setGudangDialog(true);
    };
    const handleGudangData = (gudangKode, gudangKet) => {
        setProduk((prevProduk) => ({
            ...prevProduk,
            GUDANG: gudangKode,
            KETGUDANG: gudangKet
        }));
    };

    // -----------------------------------------------------------------------------------------------------------------< Supplier >
    const [supplierDialog, setSupplierDialog] = useState(false);
    const [supplierKode, setSupplierKode] = useState('');
    const [supplierNama, setSupplierNama] = useState('');
    const btnSupplier = () => {
        setSupplierDialog(true);
    };
    const handleSupplierData = (supplierKode, supplierNama) => {
        setSupplierKode(supplierKode);
        setSupplierNama(supplierNama);
        setProduk((prevProduk) => ({
            ...prevProduk,
            SUPPLIER: supplierKode
        }));
    };

    // -----------------------------------------------------------------------------------------------------------------< Image >
    const [selectedImageOption, setSelectedImageOption] = useState('upload'); // Initial value is "upload"
    const [newImageUrl, setNewImageUrl] = useState(null);
    const [imageUrls, setImageUrls] = useState([]);
    const [isImageUploaded, setIsImageUploaded] = useState(false); // Tambahkan state untuk menandai apakah gambar sudah diunggah
    const [uploadedImageUrl, setUploadedImageUrl] = useState(null); // Tambahkan state untuk menyimpan URL gambar yang sudah diunggah

    const onImageChange = (event) => {
        setSelectedImageOption({
            ...selectedImageOption,
            image: event.target.value
        });
    };
    // ---------------------------------------------------------------- Drop Gambar
    const handleReplaceImage = () => {
        // Kode untuk menggantikan gambar yang sudah diunggah
        setIsImageUploaded(false); // Setel state kembali ke false untuk memungkinkan pengunggahan gambar baru
    };

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
                const base64Data = newImageUrl.split(',')[1]; // Ambil bagian data URL gambar tanpa prefix
                setUploadedImageUrl(base64Data); // Simpan URL gambar yang sudah diunggah tanpa prefix
                setIsImageUploaded(true);
                setProduk((prevProduk) => ({
                    ...prevProduk,
                    FOTO: base64Data // Simpan hanya data base64 tanpa prefix
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
                const base64Data = newImageUrl.split(',')[1]; // Ambil bagian data URL gambar tanpa prefix
                setUploadedImageUrl(base64Data); // Simpan URL gambar yang sudah diunggah tanpa prefix
                setIsImageUploaded(true);
                setProduk((prevProduk) => ({
                    ...prevProduk,
                    FOTO: base64Data // Simpan hanya data base64 tanpa prefix
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
    const [bahanBakuDialog, setBahanBakuDialog] = useState(false);
    const [produkKode, setProdukKode] = useState('');
    const [produkNama, setProdukNama] = useState('');
    const btnBahanBakuDialog = () => {
        setBahanBakuDialog(true);
    };
    const handleBahanBakuData2 = (produkKode, produkNama) => {
        setProdukKode(produkKode);
        setProdukNama(produkNama);
        // onRowSelectBarcode({data: {KODETOKO: produkFaktur}});
        setProduk((prevProduk) => ({
            ...prevProduk,
            NAMA: produkNama
        }));
    };

    const loadLazyData = async () => {
        // setLoading(true);
        try {
            let requestBody = {
                KODE: 'B',
                LEN: 10
            };
            const vaTable = await postData(apiEndPointGetKode, requestBody);
            const json = vaTable.data;
            setTotalRecords(json.total);
            setKode(json);
            setProduk((prevProduk) => ({
                ...prevProduk,
                KODE: json
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
            KODE: isUpdateMode ? kode : _produk.KODE,
            KODETOKO: _produk.KODETOKO,
            NAMA: _produk.NAMA,
            BKP: _produk.BKP,
            JENIS: _produk.JENIS,
            GOLONGAN: _produk.GOLONGAN,
            RAK: _produk.RAK,
            GUDANG: _produk.GUDANG,
            SUPPLIER: _produk.SUPPLIER,
            EXPIRED: getYMD(_produk.EXPIRED || new Date()),
            BERAT: _produk.BERAT,
            DOS: _produk.DOS,
            SATUAN: _produk.SATUAN,
            ISI: _produk.ISI,
            ISI2: _produk.ISI2 || 0,
            DISCOUNT: _produk.DISCOUNT,
            MIN: _produk.MIN,
            MAX: _produk.MAX,
            STOCKAWAL: stokAwal ? 'Unlimited' : _produk.STOCKAWAL || 0,
            HB: _produk.HB,
            HB2: _produk.HB2 || 0,
            HB3: _produk.HB3 || 0,
            HJ: _produk.HJ,
            HJ2: _produk.HJ2 || 0,
            HJ3: _produk.HJ3 || 0,
            FOTO: _produk.FOTO
        };

        convertUndefinedToNull(data);
        return data;
    };

    const saveProduk = async (e) => {
        e.preventDefault();
        let _produk = { ...produk };
        let _data = createDataObject(_produk);
        const fields = {
            KODETOKO: 'Barcode Masih Kosong',
            NAMA: 'Nama Masih Kosong',
            JENIS: 'Jenis Masih Kosong',
            GOLONGAN: 'Golongan Masih Kosong',
            SATUAN: 'Satuan Masih Kosong',
            HJ: 'HJ Masih Kosong',
            HB: 'HB Masih Kosong'
        };

        for (const [key, message] of Object.entries(fields)) {
            if (!_data[key]) {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: message, life: 3000 });
                return;
            }
        }

        try {
            let endPoint;
            if (isUpdateMode) {
                endPoint = apiEndPointUpdate;
            } else {
                endPoint = apiEndPointStore;
            }
            const vaTable = await postData(endPoint, _data);
            let json = vaTable.data;
            showSuccess(toast, json?.message || 'Berhasil Create Data');
            router.push('/master/inventori/bahan_baku');
        } catch (error) {
            const e = error.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };
    // ------------------------------------------------------------------------------------------------------ button
    const produkFooter = (
        <>
            <Button
                label="Cancel"
                icon="pi pi-times"
                className="p-button-text"
                onClick={() => {
                    router.push('/master/inventori/bahan_baku');
                }}
            />
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveProduk} />
        </>
    );

    // variant------------------------------------------------------------------------------------------------

    const handleVariantInput = (e, field) => {
        const val = e.target?.value || e.value;
        setVariantInputs((prevInputs) => ({
            ...prevInputs,
            [field]: val
        }));
    };

    const handleEditVariant = (e, field, index) => {
        const val = e.target?.value || e.value;
        setVariantInputs((prevInputs) => ({
            ...prevInputs,
            [field]: val
        }));

        setVariant((prevVariants) => {
            //intinya dia ngambil data variant trus di mapping dan di edit isinya sesuai index di row datatablenya
            const updatedVariants = prevVariants.map((v, ind) => {
                if (ind === index) {
                    return {
                        ...v,
                        KODE_PRODUK: produk.KODE,
                        [field]: val
                    };
                }
                return v;
            });

            //trus di masukin ke produk udah gitu
            setProduk((prevProduk) => ({
                ...prevProduk,
                VARIANT: updatedVariants
            }));

            return updatedVariants;
        });
    };

    const handleAddVariant = () => {
        if (!variantInputs.TIPE_VARIANT || !variantInputs.VARIANT) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tipe Varian atau Varian tidak boleh kosong', life: 3000 });
            return;
        }

        setVariant((prev) => [
            ...prev,
            {
                ID: null,
                TIPE_VARIANT: variantInputs.TIPE_VARIANT,
                VARIANT: variantInputs.VARIANT,
                KODE_PRODUK: '',
                BARCODE_VARIANT: '',
                HARGA_BELI_VARIANT: 0,
                HARGA_JUAL_VARIANT: 0
            }
        ]);

        setVariantInputs((prevInputs) => ({
            ...prevInputs,
            ['VARIANT']: '',
            ['BARCODE_VARIANT']: '',
            ['HARGA_BELI_VARIANT']: 0,
            ['HARGA_JUAL_VARIANT']: 0
        }));
    };

    const variantHeaderTemplate = () => {
        return (
            <>
                <div className="formgrid grid">
                    <div className="field col-12 mb-2 md:col-6">
                        <label htmlFor="tipe">Tipe</label>
                        <div className="p-inputgroup">
                            <InputText id="tipe" name="tipe" onChange={(e) => handleVariantInput(e, 'TIPE_VARIANT')} value={variantInputs.TIPE_VARIANT} />
                        </div>
                    </div>
                    <div className="field col-12 mb-2 md:col-5">
                        <label htmlFor="variant">Variant</label>
                        <div className="p-inputgroup">
                            <InputText id="variant" name="variant" onChange={(e) => handleVariantInput(e, 'VARIANT')} value={variantInputs.VARIANT} />
                        </div>
                    </div>
                    <div className="col-12 md:col-1 text-center">
                        <Button style={{ width: '100%', marginTop: '22px' }} label="Add" onClick={() => handleAddVariant()} />
                    </div>
                </div>
            </>
        );
    };

    const hrgBeliVarBodyTemplate = (rowData, { rowIndex }) => {
        return (
            <>
                <div>
                    <InputNumber id="hrg_beli" inputStyle={{ textAlign: 'right' }} onChange={(e) => handleEditVariant(e, 'HARGA_BELI_VARIANT', rowIndex)} value={rowData.HARGA_BELI_VARIANT || variantInputs.HARGA_BELI_VARIANT} />
                </div>
            </>
        );
    };

    const hrgJualVarBodyTemplate = (rowData, { rowIndex }) => {
        return (
            <>
                <div>
                    <InputNumber id="hrg_jual" inputStyle={{ textAlign: 'right' }} onChange={(e) => handleEditVariant(e, 'HARGA_JUAL_VARIANT', rowIndex)} value={rowData.HARGA_JUAL_VARIANT || variantInputs.HARGA_JUAL_VARIANT} />
                </div>
            </>
        );
    };

    const barcodeVarBodyTemplate = (rowData, { rowIndex }) => {
        return (
            <>
                <div>
                    <InputText onChange={(e) => handleEditVariant(e, 'BARCODE_VARIANT', rowIndex)} value={rowData.BARCODE_VARIANT || variantInputs.BARCODE_VARIANT} />
                </div>
            </>
        );
    };

    const VarBodyTemplate = (rowData, { rowIndex }) => {
        return (
            <>
                <div>{`${rowData.TIPE_VARIANT}-${rowData.VARIANT}`}</div>
            </>
        );
    };

    const deleteVariantOnStandby = (id) => {
        setVariant((prevVariants) => prevVariants.filter((_, ind) => ind !== id));
    };

    const actionVarBodyTemplate = (rowData, { rowIndex }) => {
        return (
            <>
                <div>{<Button icon="pi pi-trash" severity="warning" rounded onClick={() => deleteVariantOnStandby(rowIndex)} />}</div>
            </>
        );
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>{isUpdateMode ? 'Edit' : 'Add'} Bahan Baku</h4>
                    <hr />
                    <Toast ref={toast} />
                    <div className="p-fluid">
                        {/* Section Detail Item */}
                        <div className="p-fluid">
                            {/* BARIS 1: Kode & Barcode */}
                            <div className="grid">
                                <div className="field col-12 md:col-6">
                                    <label htmlFor="kode">Kode</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly value={isUpdateMode ? produk.KODE : kode} />
                                    </div>
                                </div>
                                <div className="field col-12 md:col-6">
                                    <label htmlFor="barcode">Barcode</label>
                                    <div className="p-inputgroup">
                                        <InputText
                                            id="barcode"
                                            value={produk.KODETOKO}
                                            onChange={(e) => onInputChange(e, 'KODETOKO')}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* BARIS 2: Nama Produk & Jenis */}
                            <div className="grid">
                                <div className="field col-12 md:col-6">
                                    <label htmlFor="namaproduk">Nama Produk</label>
                                    <div className="p-inputgroup">
                                        <InputText
                                            id="namaProduk"
                                            value={produk.NAMA || produkNama}
                                            onChange={(e) => onInputChange(e, 'NAMA')}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="field col-12 md:col-6">
                                    <label className="mb-1">Jenis</label>
                                    <div className="p-inputgroup">
                                        <div className="field-radiobutton mr-4">
                                            <RadioButton
                                                inputId="jenis_barang"
                                                name="Jenis"
                                                value="B"
                                                onChange={onJenisChange}
                                                checked={produk.JENIS === 'B'}
                                            />
                                            <label htmlFor="jenis_barang" className="ml-1">
                                                Barang
                                            </label>
                                        </div>
                                        <div className="field-radiobutton">
                                            <RadioButton
                                                inputId="jenis_jasa"
                                                name="Jenis"
                                                value="J"
                                                onChange={onJenisChange}
                                                checked={produk.JENIS === 'J'}
                                            />
                                            <label htmlFor="jenis_jasa" className="ml-1">
                                                Jasa
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BARIS 3: Golongan & Rak */}
                            <div className="grid">
                                <div className="field col-12 md:col-6">
                                    <label htmlFor="golongan">Golongan</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly value={produk.GOLONGAN} />
                                        <Button
                                            icon="pi pi-search"
                                            className="p-button"
                                            onClick={btnGolongan}
                                            required
                                        />
                                        <InputText readOnly value={produk.KETGOLONGAN} />
                                    </div>
                                </div>
                                <div className="field col-12 md:col-6">
                                    <label htmlFor="rak">Rak</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly value={produk.RAK} />
                                        <Button icon="pi pi-search" className="p-button" onClick={btnRak} />
                                        <InputText readOnly value={produk.KETRAK} />
                                    </div>
                                </div>
                            </div>

                            {/* BARIS 4: Gudang & Satuan */}
                            <div className="grid">
                                <div className="field col-12 md:col-6">
                                    <label htmlFor="gudang">Gudang</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly value={produk.GUDANG} />
                                        <Button icon="pi pi-search" className="p-button" onClick={btnGudang} />
                                        <InputText readOnly value={produk.KETGUDANG} />
                                    </div>
                                </div>
                                <div className="field col-12 md:col-6">
                                    <label htmlFor="supplier">Satuan</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly value={produk.SATUAN} />
                                        <Button icon="pi pi-search" className="p-button" onClick={btnSatuan} />
                                        <InputText readOnly value={produk.KETSATUAN} />
                                    </div>
                                </div>
                            </div>

                            {/* BARIS 5: Kadaluarsa, Berat, & Stok Awal */}
                            <div className="grid">
                                {/* Tanggal Kadaluarsa + Checkbox "Ada" */}
                                <div className="field col-12 md:col-4">
                                    <label htmlFor="kadaluarsa">Tanggal Kadaluarsa</label>
                                    <div className="p-inputgroup align-items-center">
                                        <Calendar
                                            id="kadaluarsa"
                                            value={new Date(produk.EXPIRED)}
                                            onChange={onDateChange}
                                            showIcon
                                            disabled={!isChecked}
                                            dateFormat="dd-mm-yy"
                                        />
                                        <Checkbox
                                            inputId="kadaluarsaCb"
                                            name="kadaluarsa"
                                            value="Kadaluarsa"
                                            checked={checkboxValue.indexOf('Kadaluarsa') !== -1}
                                            onChange={onCheckboxChange}
                                            className="ml-3"
                                        />
                                        <label htmlFor="kadaluarsaCb" className="ml-1">
                                            Ada
                                        </label>
                                    </div>
                                </div>

                                {/* Berat */}
                                <div className="field col-12 md:col-4">
                                    <label htmlFor="berat">Berat</label>
                                    <div className="p-inputgroup">
                                        <InputNumber
                                            id="berat"
                                            mode="decimal"
                                            value={produk.BERAT}
                                            onChange={(e) => onInputNumberChange(e, 'BERAT')}
                                            inputStyle={{ textAlign: 'right' }}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>

                                {/* Stok Awal */}
                                <div className="field col-12 md:col-4">
                                    <label>Stok Awal</label>
                                    <div className="p-inputgroup align-items-center mt-1">
                                        <Checkbox
                                            inputId="stok-awal"
                                            name="stokAwal"
                                            value="StokAwal"
                                            checked={stokAwal}
                                            onChange={handleCheckboxChange}
                                            className="mr-2"
                                        />
                                        {stokAwal ? (
                                            <InputText
                                                id="stok-unlimited"
                                                value="Unlimited"
                                                readOnly
                                                inputStyle={{ textAlign: 'right' }}
                                                style={{ width: '100%' }}
                                            />
                                        ) : (
                                            <InputNumber
                                                id="stok-awal"
                                                value={produk.STOCKAWAL || 0}
                                                onChange={(e) => onInputNumberChange(e, 'STOCKAWAL')}
                                                inputStyle={{ textAlign: 'right' }}
                                                style={{ width: '100%' }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* BARIS 6: Harga Beli & Harga Jual */}
                            <div className="grid">
                                {/* Harga Beli */}
                                <div className="field col-12 md:col-6">
                                    <div className="mb-3">
                                        <label htmlFor='hargaBeli'>Harga Beli</label>
                                        <div className="p-inputgroup">
                                            <InputNumber
                                                name="hargaBeli"
                                                value={produk.HB}
                                                onChange={(e) => onInputNumberChange(e, 'HB')}
                                                inputStyle={{ textAlign: 'right' }}
                                                style={{ width: '100%' }}
                                            />
                                            <span className="p-inputgroup-addon">{produk.SATUAN}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Harga Jual */}
                                <div className="field col-12 md:col-6">
                                    <div className="mb-3">
                                        <label htmlFor='hargaJual'>Harga Jual</label>
                                        <div className="p-inputgroup">
                                            <InputNumber
                                                id='hargaJual'
                                                value={produk.HJ}
                                                onChange={(e) => onInputNumberChange(e, 'HJ')}
                                                inputStyle={{ textAlign: 'right' }}
                                                style={{ width: '100%' }}
                                            />
                                            <span className="p-inputgroup-addon">{produk.SATUAN}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                        <div className="grid formgrid">
                            <div className="field-radiobutton col-12 mb-2 lg:col-12">
                                <RadioButton inputId="upload_gambar" name="image" value="upload" onChange={onImageChange} checked={selectedImageOption.image === 'upload'} />
                                <label htmlFor="upload_gambar">Upload Gambar :</label>
                            </div>
                            <div className="col-12 mb-2 lg:col-12" style={{ paddingBottom: '20px' }}>
                                {selectedImageOption.image === 'upload' && (
                                    <>
                                        <div
                                            id="dropArea"
                                            onDrop={handleDrop}
                                            onDragOver={handleDragOver}
                                            style={{
                                                width: '100%',
                                                minHeight: '150px',
                                                border: '3px dashed #ccc',
                                                borderRadius: '20px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                textAlign: 'center',
                                                marginTop: '10px',
                                                marginBottom: '20px'
                                            }}
                                        >
                                            <input
                                                id="fileInput"
                                                type="file"
                                                style={{ display: 'none' }}
                                                accept=".jpg, .jpeg, .png"
                                                onChange={handleInputChangeImage}
                                            />
                                            <Button
                                                label="Pilih atau Drop File Gambar Disini"
                                                icon="pi pi-upload"
                                                style={{ borderRadius: '20px' }}
                                                onClick={handleButtonClick}
                                            />
                                        </div>
                                        <div>Preview Gambar :</div>
                                    </>
                                )}

                                {/* Preview gambar setelah upload */}
                                {isImageUploaded && (
                                    <div className="field-wrapper col-100 mb-100 lg:col-100" id="wrapper-preview">
                                        <img
                                            src={`data:image/jpeg;base64,${isUpdateMode ? produk.FOTO : uploadedImageUrl}`}
                                            alt="Gambar preview"
                                            width={200}
                                        />
                                    </div>
                                )}

                                {/* Preview gambar jika mode edit dan belum upload ulang */}
                                {isUpdateMode && !isImageUploaded && produk.FOTO && (
                                    <div className="field-wrapper col-100 mb-100 lg:col-100" id="wrapper-preview">
                                        <img
                                            src={`data:image/jpeg;base64,${produk.FOTO}`}
                                            alt="Gambar preview"
                                            width={200}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grid formgrid">
                            <div className="field-radiobutton col-12 mb-2 lg:col-12">
                                <RadioButton inputId="capture_gambar" name="image" value="capture" onChange={onImageChange} checked={selectedImageOption.image === 'capture'} />
                                <label htmlFor="capture_gambar">Ambil Gambar :</label>
                            </div>
                            <div style={{ paddingTop: '20px' }}>
                                {selectedImageOption.image === 'capture' && (
                                    <div>
                                        <label htmlFor="">Ambil Gambar :</label>
                                        <CameraCapture />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Toolbar className="mb-4" right={produkFooter}></Toolbar>
                </div>
            </div>
            <Rak rakDialog={rakDialog} setRakDialog={setRakDialog} btnRak={btnRak} handleRakData={handleRakData} />
            <Gudang gudangDialog={gudangDialog} setGudangDialog={setGudangDialog} btnGudang={btnGudang} handleGudangData={handleGudangData} />
            <Supplier supplierDialog={supplierDialog} setSupplierDialog={setSupplierDialog} btnSupplier={btnSupplier} handleSupplierData={handleSupplierData} />
            <Golongan golonganDialog={golonganDialog} setGolonganDialog={setGolonganDialog} btnGolongan={btnGolongan} handleGolonganData={handleGolonganData} />
            <Dialog visible={satuanDialog} header="Satuan" modal className="p-fluid" onHide={() => setSatuanDialog(false)}>
                <DataTable
                    value={satuanTabelFilt}
                    // filters={lazyState.filters}
                    header={headerSatuan}
                    first={first} // Menggunakan nilai halaman pertama dari state
                    rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                    onPage={onPage} // Memanggil fungsi onPage saat halaman berubah
                    paginator
                    paginatorTemplate={`FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown`}
                    currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                    totalRecords={totalRecords} // Total number of records
                    size="small"
                    loading={loadingSatuan}
                    emptyMessage="Data Kosong"
                    onRowSelect={onRowSelectSatuan}
                    selectionMode="single" // Memungkinkan pemilihan satu baris
                    onRowsPerPageChange={(e) => setRowsPerPage(e.value)}
                >
                    <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN"></Column>
                </DataTable>
            </Dialog>
        </div>
    );
}

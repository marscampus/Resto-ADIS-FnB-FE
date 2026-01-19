/**
 * Nama Program: GODONG POS - Kasir Payment
 * Pengembang: Salsabila Emma
 * Tanggal Pengembangan: 8 Jan 2024
 * Versi: 1.0.0

    Catatan:
    - Versi 1.0.0 mencakup fungsionalitas Pembayaran Kasir hingga cetak struk
    - Read
 */
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import React, { useEffect, useRef, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { formatDateTime, formatRibuan, getDBConfig, showError } from '../../component/GeneralFunction/GeneralFunction';
import Bank from '../component/bank';
import Member from '../component/member';
import postData from '../../lib/Axios';
import { getSessionServerSide } from '../../utilities/servertool';
import { useReactToPrint } from 'react-to-print';
import PrintReceipt from './printReceipt';
import { useSession } from 'next-auth/react';
import ReceiptKitchen from './receiptKitchen';
import Anggota from '../component/anggota';
export const getServerSideProps = async (context) => {
    const sessionData = await getSessionServerSide(context, '/kasir');
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {
            _A2F: context?.req?.cookies['_A2F']
        }
    };
};

export default function MasterPayment({
    dataShift,
    addItem,
    setReloadDataMenu,
    paymentDialog,
    setPaymentDialog,
    subTotal,
    isChecked,
    setAddItem
}) {
    const apiEndPointStore = '/api/kasir/store';
    const apiEndPointGetCaraPesan = '/api/kasir/get_pemesanan';
    const apiEndPointGetDetail = '/api/mutasi_member/get_detailByKode';
    const toast = useRef(null);
    const { data: session, status } = useSession();
    const strukRef = useRef();
    const strukKitchenRef = useRef();
    const [isPrinting, setIsPrinting] = useState(false);
    const [loadingBayar, setLoadingBayar] = useState(false);
    const [dropdownPemesanan, setDropdownPemesanan] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [kembalianDialog, setKembalianDialog] = useState(false);
    const [memberDialog, setMemberDialog] = useState(false);
    const [bankDialog, setBankDialog] = useState(false);
    const initialFirstState = {
        member: '',
        namaMember: '',
        pelanggan: '',
        meja: '',
        pointAkhir: 0,
        nominalPointAkhir: 0,
        point: 0,
        nominalPoint: 0,
        nominalPointConf: 0,
        persDiscKeseluruhan: 0,
        nomDiscKeseluruhan: 0,
        persPPNKeseluruhan: 0,
        donasi: 0,
        caraPemesanan: 'Dine In',
        kodeBank: '',
        namaBank: '',
        biayaKartuBank: '',
        nomorKartu: '',
        ambilKartu: 0,
        kategoriEmoney: 'E-MONEY',
        idPelangganEpayment: '',
        isManualDonasi: false,
        notes: ''
    };
    const [firstState, setFirstState] = useState(initialFirstState);
    const initialSecondState = {
        caraBayar: 'Tunai',
        grandTotal: subTotal,
        nominalBayar: 0,
        kembalian: 0,
        donasiOtomatis: 0
    };
    const [secondState, setSecondState] = useState(initialSecondState);
    let sektor = '';
    sektor = session?.sektor;
    const emptyDataStruk = {
        KASIR: '',
        LOGOPERUSAHAAN: '',
        NAMAPERUSAHAAN: '',
        ALAMATPERUSAHAAN: '',
        TANGGAL: '',
        items: [
            {
                NAMA: '',
                HJ: '',
                DISCOUNT: '',
                PAJAK: '',
                QTY: '',
                SUBTOTAL: '',
                GRANDTOTAL: '',
                HARGADISCQTY: '',
                HARGAPPN: ''
            }
        ],
        TOTAL: ''
    };
    const emptyDataStrukDapur = {
        KASIR: '',
        LOGOPERUSAHAAN: '',
        NAMAPERUSAHAAN: '',
        ALAMATPERUSAHAAN: '',
        TANGGAL: '',
        items: [
            {
                NAMA: '',
                QTY: '',
                NOTES: ''
            }
        ]
    };
    const [dataStruk, setDataStruk] = useState(emptyDataStruk);
    const [dataStrukDapur, setDataStrukDapur] = useState(emptyDataStrukDapur);
    const dropdownValuesKategori = [
        { name: 'TERNO', code: 'TERNO' },
        { name: 'GOPAY', code: 'GOPAY' },
        { name: 'OVO', code: 'OVO' },
        { name: 'SHOPEEPAY', code: 'SHOPEEPAY' },
        { name: 'DANA', code: 'DANA' },
        // { name: 'LINKAJA', code: 'LINKAJA' },
    ];

    useEffect(() => {
        if (paymentDialog) {
            handlePerhitungan();
        }
    }, [
        subTotal,
        firstState.point,
        firstState.persDiscKeseluruhan,
        firstState.nomDiscKeseluruhan,
        firstState.persPPNKeseluruhan,
        firstState.donasi,
        paymentDialog])

    // CARA PEMESANAN
    useEffect(() => {
        async function getCaraPesan() {
            try {
                const vaTable = await postData(apiEndPointGetCaraPesan);
                const json = vaTable.data;
                setDropdownPemesanan(json.data);
            } catch (error) {
                let e = error?.response?.data || error;
                showError(toast, e?.message || 'Terjadi Kesalahan');
            }
        }

        getCaraPesan();
    }, []);

    // Fungsi untuk mencetak
    const handlePrint = useReactToPrint({
        contentRef: strukRef,
        documentTitle: 'Print Struk',
        onAfterPrint: () => setIsPrinting(false)
    });

    const handlePrintKitchen = useReactToPrint({
        contentRef: strukKitchenRef,
        documentTitle: 'Print Struk Dapur',
        onAfterPrint: () => setIsPrinting(false)
    });

    const createDataObject = (dataShift, addItem, firstState, secondState, subTotal) => {
        try {
            let discPerBarang = 0;
            let ppnPerBarang = 0;
            let totalPersPpnPerBarang = 0;
            let _data = {
                KODESESI: dataShift.SESIJUAL,
                TGL: dataShift.TGL,
                GUDANG: dataShift.KODETOKO,
                PERSDISC2: firstState.persDiscKeseluruhan, // persen diskon keseluruhan
                DISCOUNT2: firstState.nomDiscKeseluruhan,// keseluruhan
                PERSPAJAK2: firstState.persPPNKeseluruhan,// persen pajak keseluruhan
                PAJAK2: firstState.nomPpnKeseluruhan,// keseluruhan
                SUBTOTAL: subTotal,
                TOTAL: secondState.grandTotal,
                CARABAYAR: secondState.caraBayar,
                NOMINAL: secondState.nominalBayar,
                // DEBET
                BIAYAKARTU: firstState.biayaKartuBank,
                AMBILKARTU: firstState.ambilKartu,
                NAMAKARTU: firstState.namaBank,
                NOMORKARTU: firstState.nomorKartu,
                // E-Payment
                IDPELANGGAN: firstState.idPelangganEpayment,
                TIPEEPAYMENT: firstState.kategoriEmoney,
                KEMBALIAN: secondState.kembalian,
                MEMBER: firstState.member,
                NAMAMEMBER: firstState.namaMember,
                DONASI: firstState.donasi,
                MEJA: firstState.meja,
                PEMESANAN: firstState.caraPemesanan,
                PELANGGAN: firstState.pelanggan,
                detail_penjualan: addItem.map((item) => {
                    let discount = item.HARGADISCQTY || 0;
                    discPerBarang += discount;
                    const persPpnPerBarang = item.PPN || 0;
                    totalPersPpnPerBarang += persPpnPerBarang;
                    let ppn = item.HARGADISCQTY * item.PPN / 100 || 0;
                    ppnPerBarang += ppn;
                    let jumlah = item.GRANDTOTAL; // -----< GRANDTOTAL = Harga Total setelah diskon * qty >
                    return {
                        KODE: item.KODE,
                        BARCODE: item.KODE_TOKO,
                        NAMA: item.NAMA,
                        QTY: item.QTY,
                        SATUAN: item.SATUAN,
                        PPN: item.PPN,
                        DISCOUNT: item.DISCOUNT,
                        HARGADISC: item.HARGADISCQTY,
                        HARGA: item.HJ,
                        JUMLAH: jumlah,
                        NOTES: item.NOTES
                    }
                }).filter((item) => item !== null),
                DISCOUNT: discPerBarang,// per barang
                PERSPAJAK: totalPersPpnPerBarang,//per barang
                PAJAK: ppnPerBarang,//per barang

            };
            return _data;
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    const saveTransaksi = async () => {
        setLoadingBayar(true);
        if (secondState.kembalian < 0) {
            showError(toast, 'Uang yang Anda masukkan tidak sesuai dengan Total Belanja');
            setLoadingBayar(false);
            return;
        }
        let _data = createDataObject(dataShift, addItem, firstState, secondState, subTotal);
        try {
            const responsePost = await postData(apiEndPointStore, _data);
            let data = responsePost.data.data;
            let _dataGabungan = {
                ..._data,
                ...data
            };
            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Transaksi Berhasil', life: 3000 });
            if (isChecked && firstState.member) {
                const memberReq = { KODE: firstState.member };
                const memberRes = await postData(apiEndPointGetDetail, memberReq);
                const data = memberRes.data.data;
                _dataGabungan = {
                    ..._dataGabungan,
                    member: firstState.member,
                    namaMember: firstState.namaMember,
                    pointAkhir: data.TOTALPOINTAKHIR,
                    nominalPointAkhir: data.TOTALNOMINALAKHIR,
                    nominalPointConf: data.NOMINALPOINT
                };
            }
            if (isChecked) {
                setDataStruk(_dataGabungan);
                setDataStrukDapur(_dataGabungan);
                setIsPrinting(true);
                setKembalianDialog(true);
            }
            setLoadingBayar(false);
            setPaymentDialog(false);
            setAddItem([]);
            setReloadDataMenu(true);
        } catch (error) {
            setLoadingBayar(false);
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    useEffect(() => {
        if (isPrinting) {
            handlePrint();
        }
    }, [isPrinting]);

    // -----------------------------------------------------------------------------------------------------------------< Member >
    const btnMember = () => {
        setMemberDialog(true);
    };

    const handleMemberData = async (member) => {
        let requestBody = {
            KODE: member.kode
        };

        try {
            const vaTable = await postData(apiEndPointGetDetail, requestBody);
            const json = vaTable.data;
            setFirstState((prev) => ({
                ...prev,
                member: member.kode,
                namaMember: member.nama,
                pointAkhir: json.data.TOTALPOINTAKHIR,
                nominalPointAkhir: json.data.TOTALNOMINALAKHIR,
                nominalPointConf: json.data.NOMINALPOINT
            }))
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    const handleBatalMember = () => {
        setFirstState((prev) => ({
            ...prev,
            member: '',
            namaMember: '',
            pointAkhir: 0,
            nominalPointAkhir: 0,
            nominalPointConf: 0,
            point: 0,
            nominalPoint: 0
        }))
    }
    // Yang Handle Bank
    const btnBank = () => {
        setBankDialog(true);
    };
    const handleBankData = (bankKode, bankKet, bankAdmin) => {
        setFirstState((prev) => ({
            ...prev,
            kodeBank: bankKode,
            namaBank: bankKet,
            biayaKartuBank: bankAdmin
        }));
    };
    const handleOnHide = () => {
        setKembalianDialog(false);
        setFirstState(initialFirstState);
        setSecondState(initialSecondState);
    };
    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleOnHide();
        }
    };

    const handlePerhitungan = () => {
        const totalAsli = subTotal;
        const nomPointDigunakan = firstState.nominalPoint || 0;
        const nomDiskon = firstState.nomDiscKeseluruhan || 0;
        const ppnKeseluruhan = firstState.persPPNKeseluruhan || 0;
        let grandTotal = 0;
        // Subtotal 1 adalah total asli dikurangi diskon dan point
        const subtotal1 = totalAsli - nomPointDigunakan - nomDiskon;
        // Sebelum ke Subtotal 2, mari cari Nominal PPn-nya dulu
        const nomPpn = subtotal1 * ppnKeseluruhan / 100;
        // Subtotal 2 adalah subtotal 1 ditambah dengan ppn dan donasi
        const subtotal2 = subtotal1 + nomPpn;
        // Sebenernya ini cuma ide aja, donasinya bisa otomatis jadi kasir bisa bilang "ini 200nya donasi boleh?"
        const pembulatan = Math.ceil(subtotal2 / 1000) * 1000;
        const donasiOtomatis = pembulatan - subtotal2;
        const isManualDonasi = firstState.isManualDonasi;
        const finalDonasi = isManualDonasi ? firstState.donasi : donasiOtomatis;
        // Jika sudah dapat, maka taruh subtotal2 
        grandTotal = subtotal2 + finalDonasi;
        if (!isManualDonasi) {
            setFirstState((prev) => ({
                ...prev,
                donasi: finalDonasi,
                nomPpnKeseluruhan: nomPpn
            }));
        }

        setSecondState((prev) => ({
            ...prev,
            grandTotal: grandTotal,
            nominalBayar: grandTotal,
            donasiOtomatis: finalDonasi
        }))
    }

    const handleKeyDown = (e) => {
        switch (true) {
            // Member
            case e.key === 'F2':
                e.preventDefault();
                btnMember();
                break;
            // Pembayaran Tunai
            case e.shiftKey && e.key === 'A':
                e.preventDefault();
                setActiveIndex(0)
                setSecondState((prev) => ({
                    ...prev,
                    caraBayar: 'Tunai'
                }))
                break;
            // Pembayaran Debit Card
            case e.shiftKey && e.key === 'S':
                e.preventDefault();
                setActiveIndex(1);
                setSecondState((prev) => ({
                    ...prev,
                    caraBayar: 'Debit Card'
                }))
                break;
            // Bank
            case e.shiftKey && e.key === 'Q':
                e.preventDefault();
                btnBank();
                break;
            // Pembayaran E-Money
            case e.shiftKey && e.key === 'D':
                e.preventDefault();
                setActiveIndex(2);
                setSecondState((prev) => ({
                    ...prev,
                    caraBayar: 'E-Money'
                }))
                break;
            default:
                break;
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="grid">
            <Toast ref={toast} />
            <div className="col-12 lg:col-12 xl:col-12">
                <Dialog visible={paymentDialog} style={{ width: '75%' }} header="PEMBAYARAN" modal className="" onHide={(e) => {
                    setPaymentDialog(false);
                    setFirstState(initialFirstState);
                    setSecondState(initialSecondState);
                }}>
                    <div className="flex flex-column gap-2">
                        <div className="flex gap-2 align-items-center">
                            <div className="field w-full">
                                <div className="p-inputgroup">
                                    <InputText
                                        readOnly
                                        value={firstState.namaMember}
                                        placeholder="Member"
                                        disabled={firstState.pelanggan} />
                                    <Button
                                        icon="pi pi-search"
                                        className="p-button"
                                        onClick={btnMember}
                                        disabled={firstState.pelanggan} />
                                    {firstState.member ? (
                                        <div>
                                            <Button label="Batal" className="p-button-danger p-button-md ml-2" onClick={handleBatalMember} />
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            <div className="field">
                                <div className="p-inputgroup">
                                    <InputText readOnly value={`${formatRibuan(secondState.grandTotal)}`} onChange={(e) => onInputChange(e, 'KODE')} style={{ fontSize: '14px', textAlign: 'right', backgroundColor: '#f5f5f5', fontWeight: 'bold' }} />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-column gap-2 w-full">
                            <div className="flex gap-2 w-full">
                                <div className="flex gap-2 flex-column w-full">
                                    <label className="font-bold">Pelanggan</label>
                                    <div className="p-inputgroup">
                                        <div className="p-inputgroup">
                                            <InputText
                                                autoFocus
                                                value={firstState.pelanggan}
                                                disabled={firstState.member}
                                                placeholder="Nama Pelanggan"
                                                onChange={(e) =>
                                                    setFirstState((prev) => ({
                                                        ...prev,
                                                        pelanggan: e.target.value
                                                    }))
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-column w-full">
                                    <label className="font-bold">Meja</label>
                                    <div className="p-inputgroup">
                                        <div className="p-inputgroup">
                                            <InputText
                                                value={firstState.meja}
                                                placeholder="No Meja"
                                                onChange={(e) =>
                                                    setFirstState((prev) => ({
                                                        ...prev,
                                                        meja: e.target.value
                                                    }))
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {firstState.member && (
                                <div className="flex flex-row gap-2">
                                    {/* Sisa Point */}
                                    <div className="flex gap-2 flex-column w-full">
                                        <label className="font-bold">Sisa Point</label>
                                        <div className="p-inputgroup">
                                            <InputNumber readOnly value={firstState.pointAkhir} inputStyle={{ textAlign: 'right' }} />
                                            <InputNumber readOnly value={firstState.nominalPointAkhir} inputStyle={{ textAlign: 'right' }} />
                                        </div>
                                    </div>

                                    {/* Gunakan Point */}
                                    <div className="flex gap-2 flex-column w-full">
                                        <label className="font-bold">Gunakan Point</label>
                                        <div className="p-inputgroup">
                                            <InputNumber
                                                value={firstState.point || 0}
                                                inputStyle={{ textAlign: 'right' }}
                                                onChange={(e) => {
                                                    const point = e.value || 0;
                                                    if (point > firstState.pointAkhir) {
                                                        showError(toast, 'Point yang dimasukkan melebihi Sisa Point')
                                                        setFirstState((prev) => ({
                                                            ...prev,
                                                            point: 0,
                                                            nominalPoint: 0
                                                        }));
                                                        return;
                                                    }
                                                    // Pada bagian ini, hitung dulu poin yang akan digunakan dengan nilai point yang sudah disetting pada config
                                                    const nominal = point * firstState.nominalPointConf;
                                                    //  Lalu ambil nilainya dan taruh disini
                                                    setFirstState((prev) => ({
                                                        ...prev,
                                                        point: point,
                                                        nominalPoint: nominal
                                                    }));
                                                }}
                                                min={0}
                                            />

                                            <InputNumber readOnly value={firstState.nominalPoint} inputStyle={{ textAlign: 'right' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className={`flex gap-2 w-full`}>
                                <div className="flex flex-column gap-2 justify-content-end w-full">
                                    <div className="flex gap-2 w-full">
                                        <div className="flex gap-2 flex-column w-full">
                                            <label className="font-bold">Discount Keseluruhan</label>
                                            <div className="p-inputgroup">
                                                <InputNumber
                                                    value={firstState.persDiscKeseluruhan || 0}
                                                    onChange={(e) => {
                                                        const persentase = e.value || 0;
                                                        //  Pada bagian ini, hitung dulu berapa diskonnya
                                                        const nominalDiskon = (subTotal * persentase) / 100;
                                                        //  Lalu diambil nilainya dan taruh disini
                                                        setFirstState((prev) => ({
                                                            ...prev,
                                                            persDiscKeseluruhan: persentase,
                                                            nomDiscKeseluruhan: nominalDiskon
                                                        }));
                                                    }}
                                                    inputStyle={{ textAlign: 'right' }}
                                                    min={0}
                                                    max={100}
                                                />
                                                <Button icon="pi pi-percentage" className="p-button" readOnly />
                                                <InputNumber
                                                    value={firstState.nomDiscKeseluruhan || 0}
                                                    onChange={(e) => {
                                                        const nominal = e.value || 0;
                                                        if (nominal > subTotal) {
                                                            showError(toast, 'Nominal Diskon tidak boleh melebihi Total')
                                                            setFirstState((prev) => ({
                                                                ...prev,
                                                                nomDiscKeseluruhan: 0,
                                                                persDiscKeseluruhan: 0
                                                            }));
                                                            return;
                                                        }
                                                        const persen = subTotal > 0 ? (nominal / subTotal) * 100 : 0;
                                                        setFirstState((prev) => ({
                                                            ...prev,
                                                            nomDiscKeseluruhan: nominal,
                                                            persDiscKeseluruhan: persen
                                                        }));
                                                    }}
                                                    inputStyle={{ textAlign: 'right' }}
                                                    min={0}
                                                />

                                            </div>
                                        </div>
                                        {/* <div className="flex gap-2 flex-column w-full">
                                            <label className="font-bold">PPN Keseluruhan</label>
                                            <div className="p-inputgroup">
                                                <InputNumber
                                                    value={firstState.persPPNKeseluruhan || 0}
                                                    onChange={(e) =>
                                                        setFirstState((prev) => ({
                                                            ...prev,
                                                            persPPNKeseluruhan: e.value
                                                        }))
                                                    }
                                                    inputStyle={{ textAlign: 'right' }}
                                                    min={0}
                                                    max={100}
                                                />
                                                <Button icon="pi pi-percentage" className="p-button" readOnly />
                                            </div>
                                        </div> */}
                                        <div className="flex gap-2 flex-column w-full">
                                            <label className="font-bold">Donasi</label>
                                            <div className="p-inputgroup">
                                                <InputNumber
                                                    placeholder="Donasi"
                                                    value={firstState.donasi || 0}
                                                    onChange={(e) =>
                                                        setFirstState((prev) => ({
                                                            ...prev,
                                                            donasi: e.value,
                                                            isManualDonasi: true
                                                        }))
                                                    }
                                                    inputStyle={{ textAlign: 'right' }}
                                                />
                                            </div>
                                        </div>
                                        {sektor && sektor == 'Food & Beverage' && (
                                            <div className="flex gap-2 flex-column w-full">
                                                <label className="font-bold">Cara Pemesanan</label>
                                                <Dropdown
                                                    value={firstState.caraPemesanan}
                                                    optionLabel="KETERANGAN"
                                                    optionValue="KETERANGAN"
                                                    options={dropdownPemesanan}
                                                    onChange={(e) =>
                                                        setFirstState((prev) => ({
                                                            ...prev,
                                                            caraPemesanan: e.value
                                                        }))
                                                    }
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full">
                            <div className="flex gap-2 w-full">
                                <TabView
                                    activeIndex={activeIndex}
                                    onTabChange={(e) => {
                                        if (e.index == 1) {
                                            setSecondState((prev) => ({
                                                ...prev,
                                                caraBayar: 'Debit Card'
                                            }))
                                        } else if (e.index == 2) {
                                            setSecondState((prev) => ({
                                                ...prev,
                                                caraBayar: 'E-Money'
                                            }))
                                        } else {
                                            setSecondState((prev) => ({
                                                ...prev,
                                                caraBayar: 'Tunai'
                                            }))
                                        }
                                        setActiveIndex(e.index);
                                    }}
                                    className="w-full"
                                >
                                    {/* ------------------------------------ Tab Tunai ------------------------------------ */}
                                    <TabPanel header="Bayar Tunai">
                                        <div className="flex gap-2 w-full">
                                            <div className="flex flex-column gap-2 w-full">
                                                <label className="font-bold">Nominal</label>
                                                <div className="p-inputgroup w-full">
                                                    <InputNumber
                                                        value={secondState.nominalBayar}
                                                        onChange={(e) => {
                                                            const nominal = e.value || 0;
                                                            // Pada bagian ini, hitung nominal yang dimasukkan lalu dikurangi dengan grand total
                                                            const kembalian = nominal - secondState.grandTotal;
                                                            //  Lalu ambil nilainya dan taruh disini
                                                            setSecondState((prev) => ({
                                                                ...prev,
                                                                nominalBayar: nominal,
                                                                kembalian: kembalian
                                                            }));
                                                        }}
                                                        min={0}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                saveTransaksi();
                                                            }
                                                        }}
                                                        className="w-full"
                                                        inputStyle={{ textAlign: 'right' }}

                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </TabPanel>

                                    {/* ------------------------------------ Tab Debit Card ------------------------------------ */}
                                    <TabPanel header="Transfer & QRIS">
                                        <div className="flex gap-2 w-full flex-column">
                                            <div className="flex">
                                                <div className="flex gap-2 flex-column w-full">
                                                    <label className="font-bold ">Nama Kartu</label>
                                                    <div className="p-inputgroup">
                                                        <InputText readOnly value={firstState.namaBank} className="w-full" />
                                                        <Button icon="pi pi-search" onClick={btnBank} />
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 flex-column w-full">
                                                    <label className="font-bold ">Nomor Kartu</label>
                                                    <div className="p-inputgroup">
                                                        <InputText
                                                            value={firstState.NOMORKARTU}
                                                            onChange={(e) =>
                                                                setFirstState((prev) => ({
                                                                    ...prev,
                                                                    nomorKartu: e.target.value
                                                                }))
                                                            }
                                                            className="w-full" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-column gap-2 w-full">
                                                <label className="font-bold ">Ambil Tunai</label>
                                                <div className="p-inputgroup">
                                                    <InputNumber value={firstState.ambilKartu} mode="currency" currency="IDR" locale="id-ID" className="w-full" inputStyle={{ textAlign: 'right' }} />
                                                </div>
                                            </div>

                                            <div className="flex flex-column gap-2 w-full">
                                                <label className="font-bold ">Biaya Kartu</label>
                                                <div className="p-inputgroup">
                                                    <InputNumber readOnly value={firstState.biayaKartuBank} inputStyle={{ textAlign: 'right' }} mode="currency" currency="IDR" locale="id-ID" className="w-full" />
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="flex-column flex gap-2 w-full">
                                                    <label className="font-bold ">Nominal</label>
                                                    <div className="p-inputgroup">
                                                        <InputNumber
                                                            value={secondState.grandTotal}
                                                            mode="currency"
                                                            currency="IDR"
                                                            locale="id-ID"
                                                            className="w-full"
                                                            inputStyle={{ textAlign: 'right' }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    saveTransaksi();
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabPanel>

                                    {/* ------------------------------------ Tab e-Money ------------------------------------ */}
                                    <TabPanel header="e-Wallet">
                                        <div className="flex flex-column gap-2 w-full">
                                            <div className="flex gap-2">
                                                <div className="flex flex-column w-full gap-2">
                                                    <label className="font-bold block">Kategori</label>
                                                    <div className="p-inputgroup">
                                                        <Dropdown
                                                            value={firstState.kategoriEmoney}
                                                            options={dropdownValuesKategori}
                                                            optionLabel="name"
                                                            optionValue="name"
                                                            onChange={(e) =>
                                                                setFirstState((prev) => ({
                                                                    ...prev,
                                                                    kategoriEmoney: e.value
                                                                }))
                                                            }
                                                            placeholder="Pilih Kategori"
                                                            className="w-full" />
                                                    </div>
                                                </div>

                                                <div className="flex flex-column w-full gap-2">
                                                    <label className="font-bold block">ID Pelanggan</label>
                                                    <div className="p-inputgroup">
                                                        <InputText value={firstState.idPelangganEpayment} onChange={(e) =>
                                                            setFirstState((prev) => ({
                                                                ...prev,
                                                                idPelangganEpayment: e.target.value
                                                            }))
                                                        } className="w-full" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-column gap-2">
                                                <label className="font-bold block">Nominal</label>
                                                <div className="p-inputgroup">
                                                    <InputNumber value={secondState.grandTotal} onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            saveTransaksi();
                                                        }
                                                    }} mode="currency" currency="IDR" locale="id-ID" className="w-full" inputStyle={{ textAlign: 'right' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </TabPanel>
                                </TabView>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full">
                            <div className="card w-full py-1 px-2" style={{ backgroundColor: '#f5f5f5' }}>
                                <div className="flex w-full gap-2 justify-content-center align-items-center">
                                    <div className="flex align-items-center" style={{ textWrap: 'nowrap', textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>
                                        <strong>Kembali : </strong>
                                    </div>
                                    <div className="p-inputgroup w-full">
                                        {(
                                            <InputText
                                                type="text"
                                                value={`Rp. ${formatRibuan(secondState.kembalian)}`}
                                                readOnly
                                                style={{
                                                    fontSize: '44px',
                                                    textAlign: 'right',
                                                    border: 'none',
                                                    outline: 'none',
                                                    boxShadow: 'none',
                                                    backgroundColor: 'transparent',
                                                    color: secondState.kembalian < 0 ? 'red' : 'inherit'
                                                }}
                                                className="w-full"
                                            />

                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-column gap-2 w-full">
                            <div className="flex gap-2 w-full justify-content-end">
                                <div className="flex gap-2">
                                    <div className="p-inputgroup" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button label="Batal" className="p-button-secondary p-button-lg mr-2" style={{ width: '120px' }} />
                                        <Button loading={loadingBayar} label="Bayar" className="p-button-primary p-button-lg" style={{ width: '120px' }} onClick={() => saveTransaksi()} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Dialog>
                <Anggota anggotaDialog={memberDialog} setAnggotaDialog={setMemberDialog} handleAnggotaData={handleMemberData} />
                <Bank bankDialog={bankDialog} setBankDialog={setBankDialog} btnBank={btnBank} handleBankData={handleBankData} />
                {/* -----------------------------------------------------------------------------------------< KARTU - BANK > */}
                <Dialog visible={kembalianDialog} modal className="p-fluid" closable={false}>
                    <div className="" style={{ fontWeight: 'bold', fontSize: '12pt' }}>
                        Kembalian :
                    </div>
                    <InputText className="w-full mt-2" onKeyDown={handleKeyPress} readOnly value={`Rp. ${formatRibuan(secondState.kembalian)}`} style={{ fontSize: '26px', textAlign: 'right', backgroundColor: '#f5f5f5', fontWeight: 'bold' }} />
                    <div className="mt-3">
                        <Button label="Transaksi Baru" className="p-button-primary p-button-lg w-full" onClick={handleOnHide} />
                    </div>
                    {sektor && sektor == 'Food & Beverage' && (
                        <div className="mt-3">
                            <Button label="Cetak Struk Dapur" className="p-button-primary p-button-lg w-full" onClick={() => handlePrintKitchen()} />
                        </div>
                    )}
                </Dialog>
                {/* Yang Handle Print Struk */}
                <div>
                    {/* Render komponen struk di dalam div */}
                    <div style={{ display: 'none' }}>
                        <PrintReceipt ref={strukRef} dataStruk={dataStruk} />
                    </div>
                    <div style={{ display: 'none' }}>
                        <ReceiptKitchen ref={strukKitchenRef} dataStrukDapur={dataStrukDapur} />
                    </div>
                </div>
                <div>
                </div>
            </div>
        </div >
    );
}
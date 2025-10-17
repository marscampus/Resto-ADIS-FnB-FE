import { startOfMonth, endOfMonth } from 'date-fns';
import { useSession } from 'next-auth/react';
import { Chart } from 'primereact/chart';
import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { getSessionServerSide } from '../utilities/servertool';
import moment from 'moment';
import { formatRibuan, convertToISODate, formatAndSetDate, formatDate } from '../component/GeneralFunction/GeneralFunction';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import postData from '../lib/Axios';
import { exportToXLSX } from '../component/exportXLSX/exportXLSX';
export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function DashboardDua() {
    const apiEndPointInsertUsername = '/api/insert/username';
    const apiEndPointGetDashboard = '/api/dashboard';
    const [loading, setLoading] = useState(false);
    const [tgl, setTgl] = useState(new Date());
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    const [dashboard, setDashboard] = useState('');
    const [dataProdukTerlaris, setDataProdukTerlaris] = useState([]);
    const [dataMember, setDataMember] = useState([]);
    const [periode, setPeriode] = useState({
        startDate: moment().startOf('month').toDate(), // BOM bulan ini
        endDate: moment().endOf('month').toDate() // EOM bulan ini
    });
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    useEffect(() => {
        loadLazyData();
    }, []);

    const loadLazyData = async () => {
        setLoading(true);
        try {
            let requestBody = { ...lazyState };
            // Untuk memasukkan USERNAME ke database
            await postData(apiEndPointInsertUsername, lazyState);
            if (periode.startDate && periode.endDate) {
                requestBody.PERIODE_START = convertToISODate(periode.startDate);
                requestBody.PERIODE_END = convertToISODate(periode.endDate);
            }
            const vaTable = await postData(apiEndPointGetDashboard, requestBody);
            const json = vaTable.data;
            setDashboard(json);
            const formattedData = json.dataProdukTerlaris.map((item) => ({
                ...item,
                Qty: parseFloat(item.Qty)
            }));
            setDataProdukTerlaris(formattedData);
            setTotalRecords(formattedData.length);
            setDataMember(json.dataMember)
            // Setelah mendapatkan data dashboard, update labels dan data untuk chart
            const currentDate = convertToISODate(periode.startDate); // assuming json.currentDate is in a compatible date format
            const daysInMonth = moment(currentDate).daysInMonth();
            const labels = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());

            // Inisialisasi array dengan panjang sama dengan jumlah hari dalam bulan
            const salesData = Array.from({ length: daysInMonth }, () => 0);

            // Iterasi melalui data penjualan dan tambahkan jumlah penjualan ke tanggal yang sesuai
            json.dataPenjualan.forEach((item) => {
                const date = new Date(item.DATETIME); // assuming item.DATETIME is in a compatible date format
                const day = date.getDate();
                salesData[day - 1] += 1; // menambahkan 1 untuk setiap data penjualan pada tanggal terkait
            });

            // Update data for the chart
            setChartData({
                labels: labels,
                datasets: [
                    {
                        label: `Bulan ${moment(currentDate).format('MMMM')}`,
                        backgroundColor: ['#FFB6C1', '#AFEEEE', '#FFD700', '#98FB98', '#DDA0DD', '#87CEFA', '#F08080', '#FFA07A', '#90EE90', '#FA8072', '#ADD8E6', '#FFC0CB'],
                        data: salesData,
                        pointRadius: 5
                    }
                ]
            });
        } catch (error) {
            console.error('Error while loading data:', error);
        } finally {
            setLoading(false);
        }
    };
    const refresh = () => {
        setLoading(true);
        loadLazyData();
        setLoading(false);
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        height: 500,
        scales: {
            x: [
                {
                    grid: {
                        display: false
                    }
                }
            ],
            y: [
                {
                    ticks: {
                        beginAtZero: true
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Jumlah' // You can customize the y-axis label as needed
                    }
                }
            ]
        }
    };

    // State to store chart data
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: []
    });

    // Handle Date
    const handleTgl = (e) => {
        setTgl(e.value);
    };
    const handleTglChange = (e) => {
        const inputValue = e.target.value;
        formatAndSetDate(inputValue, setTgl);
    };

    const handlePeriodeDateChange = (e) => {
        const selectedDate = e.value;
        const startOfMonth = moment(selectedDate).startOf('month').toDate();
        const endOfMonth = moment(selectedDate).endOf('month').toDate();

        setPeriode({
            startDate: startOfMonth,
            endDate: endOfMonth
        });
    };

    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup">
                    <Button className="p-button-primary mr-2" label='Export XLSX' onClick={() =>
                        exportToXLSX(dataMember, `top-member-${formatDate(new Date())}.xlsx`)
                    }></Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-column w-full gap-2">
            {/* Header Section */}
            <div className="flex flex-column lg:flex-row gap-2 w-full">
                <div className="card flex flex-1 h-6rem">
                    <div className="flex gap-2 align-items-center justify-content-between w-full h-full">
                        <div>
                            <h4 className="m-0">
                                <i className="pi pi-calendar mr-2"></i>Periode
                            </h4>
                        </div>
                        <div className="flex gap-2">
                            <div className="text-xl font-bold text-900">{dashboard.currentDate || '-'}</div>
                        </div>
                    </div>
                </div>
                <div className="card flex flex-1 h-6rem">
                    <div className="flex w-full align-items-center justify-content-between h-full">
                        <div>
                            <h4 className="m-0">
                                <i className="pi pi-clock mr-2"></i>Hari Ini
                            </h4>
                        </div>
                        <div className="flex gap-2">
                            <Calendar name="periode" value={periode.startDate} onChange={handlePeriodeDateChange} monthNavigator yearNavigator view="month" yearRange="2000:2050" dateFormat="mm-yy" className="w-10rem" />
                            <Button icon="pi pi-refresh" className="p-button-rounded p-button-outlined" onClick={refresh} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Sales Overview */}
            <div className="flex gap-2 w-full">
                <div className="card w-full">
                    <div className="flex align-items-center justify-content-between mb-4">
                        <h4 className="m-0">Penjualan Per Hari Ini {formatDate(tgl) || '-'}</h4>
                    </div>

                    <div className="flex-column flex gap-2">
                        <div className="flex gap-2 lg:flex-row flex-column">
                            {[
                                { icon: 'pi pi-receipt', color: 'blue', title: 'JUMLAH TRANSAKSI', value: formatRibuan(dashboard.trxJualNow) },
                                { icon: 'pi pi-shopping-cart', color: 'orange', title: 'BARANG TERJUAL', value: formatRibuan(dashboard.barangTerjualNow) },
                                { icon: 'pi pi-wallet', color: 'purple', title: 'NOMINAL PENJUALAN', value: formatRibuan(dashboard.nominalPenjualanNow) }
                            ].map((item, index) => (
                                <div key={index} className="flex flex-column gap-2 w-full">
                                    <div className={`p-3 border-round bg-${item.color}-100`}>
                                        <div className="flex align-items-center gap-3">
                                            <i className={`pi ${item.icon} text-${item.color}-500 text-2xl`}></i>
                                            <div>
                                                <div className="text-sm text-600">{item.title}</div>
                                                <div className="text-2xl font-bold">{loading ? <i className="pi pi-spinner pi-spin" /> : item.value}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2 lg:flex-row flex-column">
                            {[
                                { icon: 'pi pi-shopping-cart', color: 'blue', title: 'PEMBELIAN', value: dashboard.countPembelian },
                                { icon: 'pi pi-tags', color: 'orange', title: 'PENJUALAN', value: dashboard.countPenjualan },
                                { icon: 'pi pi-sync', color: 'purple', title: 'RETUR', value: dashboard.countRtnPenjualan },
                                { icon: 'pi pi-file', color: 'red', title: 'JUMLAH BARANG', value: dashboard.countStock },
                                { icon: 'pi pi-briefcase', color: 'cyan', title: 'PURCHASE ORDER', value: dashboard.countPo }
                            ].map((item, index) => (
                                <div key={index} className="flex flex-column gap-2 w-full">
                                    <div className={`p-3 border-round bg-${item.color}-100`}>
                                        <div className="flex flex-column align-items-center gap-2">
                                            <i className={`pi ${item.icon} text-${item.color}-500 text-2xl`}></i>
                                            <div className="text-center">
                                                <div className="text-sm text-600">{item.title}</div>
                                                <div className="text-xl font-bold">{loading ? <i className="pi pi-spinner pi-spin" /> : item.value}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Metrics */}
            <div className="flex gap-2 mt-5 w-full">
                <div className="card p-4 h-full w-full">
                    <h5>Grafik Penjualan Harian</h5>
                    <Chart type="line" data={chartData} options={options} style={{ minHeight: '295px', height: '295px' }} />
                </div>
                <div className="flex gap-2 w-full">
                    <div className="flex gap-2 flex-column w-full">
                        {[
                            { title: 'Penjualan Kotor', value: dashboard.gross, updated: dashboard.lastUpdateGross },
                            { title: 'Penjualan Bersih', value: dashboard.netto, updated: dashboard.lastUpdateNetto },
                            { title: 'Total Transaksi', value: dashboard.allTrx, updated: dashboard.lastUpdateAllTrx },
                            { title: 'Rata-rata Transaksi', value: dashboard.avg, updated: dashboard.lastUpdateAvg }
                        ].map((item, index) => (
                            <div key={index} className="w-full">
                                <div className="card p-3">
                                    <div className="flex justify-content-between align-items-center">
                                        <div>
                                            <div className="font-medium">{item.title}</div>
                                            <div className="text-2xl font-bold text-900">{loading ? <i className="pi pi-spinner pi-spin" /> : `Rp.${formatRibuan(item.value)}`}</div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-500 mt-2">Terakhir update: {item.updated || '-'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Best Selling Products */}
            <div className="flex gap-2  w-full">
                <div className="card p-4 w-full">
                    <div className="flex justify-content-between align-items-center mb-4">
                        <h5 className="m-0">Produk Terlaris Bulan {dashboard.currentDate}</h5>
                    </div>

                    <DataTable
                        value={dataProdukTerlaris}
                        size='small'
                        loading={loading}
                        scrollable
                        scrollHeight="400px"
                    >
                        <Column field="Kode" header="KODE" style={{ width: '120px' }} />
                        <Column field="Barcode" header="BARCODE" />
                        <Column field="Nama" header="NAMA BARANG" />
                        <Column field="Qty" header="TERJUAL" bodyStyle={{ textAlign: 'right' }} headerStyle={{ textAlign: 'right' }} />
                    </DataTable>
                </div>
            </div>
        </div>
    );
}

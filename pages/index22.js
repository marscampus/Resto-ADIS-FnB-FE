
import { useSession } from "next-auth/react"
import { Chart } from "primereact/chart";
import Router from 'next/router'
import { redirect } from 'next/navigation';
import { useEffect } from "react";
import Restricted from "../component/page/restricted";


export default function Dashboard() {
    // const router = useRouter();
    const { data: session, status } = useSession();
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        height: 400,
        scales: {
            x: [
                {
                    grid: {
                        display: false,
                    },
                },
            ],
            y: [
                {
                    ticks: {
                        beginAtZero: true,
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Jumlah', // You can customize the y-axis label as needed
                    },
                },
            ],

        },
    };
    const generateRandomData = (min, max, length) => {
        return Array.from({ length }, () => Math.floor(Math.random() * (max - min + 1)) + min);
    };

    // Define the range for random numbers and the length of the array
    const minRandomValue = 0;
    const maxRandomValue = 200;
    const numberOfMonths = 12;

    // Generate random data
    const randomData = generateRandomData(minRandomValue, maxRandomValue, numberOfMonths);

    // Set the random data in the datasets
    const data = {
        labels: [
            '1', '2', '3', '4', '5', '6',
            '7', '8', '9', '10', '11', '12'
        ],
        datasets: [
            {
                label: `Bulan Desember`,
                backgroundColor: [
                    '#FFB6C1', '#AFEEEE', '#FFD700', '#98FB98', '#DDA0DD', '#87CEFA',
                    '#F08080', '#FFA07A', '#90EE90', '#FA8072', '#ADD8E6', '#FFC0CB'
                ],
                data: randomData,
                pointRadius: 5,
            },
        ],
    };

    return (
        <div className="grid">
            <div className="col-12 lg:col-6 xl:col-8">
                <div className="card mb-0">
                    <div className="formgrid grid">
                        <div className="col-4 lg:col-4 xl:col-4">
                            <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ minHeight: "25px", padding: "2px" }}>
                                <i className="pi pi-shopping-cart text-blue-500 text-xl" style={{ margin: '5px' }} />
                                <span className="block text-800 font-medium mb-3 text-center mt-3"><strong>PEMBELIAN</strong></span>
                            </div>
                            <div>
                                <div className="text-900 font-medium text-xl text-center mt-2">1873</div>
                            </div>
                        </div>
                        <div className="col-4 lg:col-8 xl:col-4">
                            <div className="flex align-items-center justify-content-center bg-orange-100 border-round" style={{ minHeight: "25px", padding: "2px" }}>
                                <i className="pi pi-tags text-orange-500 text-xl" style={{ margin: '5px' }} />
                                <span className="block text-800 font-medium mb-3 text-center mt-3"><strong>PENJUALAN</strong></span>
                            </div>
                            <div>
                                <div className="text-900 font-medium text-xl text-center mt-2">177</div>
                            </div>
                        </div>
                        <div className="col-4 lg:col-8 xl:col-4">
                            <div className="flex align-items-center justify-content-center bg-purple-100 border-round" style={{ minHeight: "25px", padding: "2px" }}>
                                <i className="pi pi-sync text-purple-500 text-xl" style={{ margin: '5px' }} />
                                <span className="block text-800 font-medium mb-3 text-center mt-3"><strong>RETUR</strong></span>
                            </div>
                            <div>
                                <div className="text-900 font-medium text-xl text-center mt-2">177</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-12 lg:col-6 xl:col-4">
                <div className="card mb-0">
                    <div className="formgrid grid">
                        <div className="col-6 lg:col-6 xl:col-6">
                            <div className="flex align-items-center justify-content-center bg-red-100 border-round" style={{ minHeight: "25px", padding: "2px" }}>
                                <i className="pi pi-file text-red-500 text-xl" style={{ margin: '5px' }} />
                                <span className="block text-800 font-medium mb-3 text-center mt-3"><strong>JUMLAH BARANG</strong></span>
                            </div>
                            <div>
                                <div className="text-900 font-medium text-xl text-center mt-2">177</div>
                            </div>
                        </div>
                        <div className="col-6 lg:col-6 xl:col-6">
                            <div className="flex align-items-center justify-content-center bg-cyan-100 border-round" style={{ minHeight: "25px", padding: "2px" }}>
                                <i className="pi pi-briefcase text-cyan-500 text-xl" style={{ margin: '5px' }} />
                                <span className="block text-800 font-medium mb-3 text-center mt-3"><strong>PURCHASE ORDER</strong></span>
                            </div>
                            <div>
                                <div className="text-900 font-medium text-xl text-center mt-2">177</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* ---------------------------------------------------------------------------------------------------------------------------------------------- */}
            <div className="col-12 lg:col-6 xl:col-8">
                <div className="card mb-2">
                    <h5>Grafik Penjualan Harian</h5>
                    <Chart type="line" data={data} options={options}></Chart>
                </div>
                <div className="card mb-2">
                    <h5>Grafik Penjualan Harian</h5>
                    <Chart type="line" data={data} options={options}></Chart>
                </div>
            </div>
            <div className="col-12 lg:col-6 xl:col-4">
                <div className="card mb-2">
                    <div className="formgrid grid">
                        <div className="col-6 lg:col-6 xl:col-6">
                            <div className="flex justify-content-between mb-3">
                                <span className="mb-3">
                                    <strong>Penjualan Kotor</strong>
                                </span>
                            </div>
                        </div>
                        <div className="col-6 lg:col-6 xl:col-6">
                            <div className="text-900 font-medium mt-5 text-l" style={{ textAlign: "right" }}>
                                {/* {loading ? (
                                    <i className="pi pi-spinner pi-spin" style={{ fontSize: '1.5em', marginRight: '8px' }} />
                                ) : (
                                    <p>Rp.{numberWithCommas(aset)}</p>
                                )} */}
                                <p>Rp. 178.000.200</p>
                            </div>
                        </div>
                    </div>
                    <hr style={{ margin: "0" }}></hr>
                    <div style={{ fontSize: "14px" }}>
                        {/* <p>Last Updated: {lastUpdated ? `${formatDateTable(lastUpdated)}` : "-"}</p> */}
                        <p>Last Updated: -</p>
                    </div>
                </div>
                <div className="card mb-2">
                    <div className="formgrid grid">
                        <div className="col-6 lg:col-6 xl:col-6">
                            <div className="flex justify-content-between mb-3">
                                <span className="mb-3">
                                    <strong>Penjualan Bersih</strong>
                                </span>
                            </div>
                        </div>
                        <div className="col-6 lg:col-6 xl:col-6">
                            <div className="text-900 font-medium mt-5 text-l" style={{ textAlign: "right" }}>
                                {/* {loading ? (
                                    <i className="pi pi-spinner pi-spin" style={{ fontSize: '1.5em', marginRight: '8px' }} />
                                ) : (
                                    <p>Rp.{numberWithCommas(aset)}</p>
                                )} */}
                                <p>Rp. 178.000.200</p>
                            </div>
                        </div>
                    </div>
                    <hr style={{ margin: "0" }}></hr>
                    <div style={{ fontSize: "14px" }}>
                        {/* <p>Last Updated: {lastUpdated ? `${formatDateTable(lastUpdated)}` : "-"}</p> */}
                        <p>Last Updated: -</p>
                    </div>
                </div>
                <div className="card mb-2">
                    <div className="formgrid grid">
                        <div className="col-6 lg:col-6 xl:col-6">
                            <div className="flex justify-content-between mb-3">
                                <span className="mb-3">
                                    <strong>Jumlah Seluruh Transaksi</strong>
                                </span>
                            </div>
                        </div>
                        <div className="col-6 lg:col-6 xl:col-6">
                            <div className="text-900 font-medium mt-5 text-l" style={{ textAlign: "right" }}>
                                {/* {loading ? (
                                    <i className="pi pi-spinner pi-spin" style={{ fontSize: '1.5em', marginRight: '8px' }} />
                                ) : (
                                    <p>Rp.{numberWithCommas(aset)}</p>
                                )} */}
                                <p>Rp. 178.000.200</p>
                            </div>
                        </div>
                    </div>
                    <hr style={{ margin: "0" }}></hr>
                    <div style={{ fontSize: "14px" }}>
                        {/* <p>Last Updated: {lastUpdated ? `${formatDateTable(lastUpdated)}` : "-"}</p> */}
                        <p>Last Updated: -</p>
                    </div>
                </div>
                <div className="card mb-2">
                    <div className="formgrid grid">
                        <div className="col-6 lg:col-6 xl:col-6">
                            <div className="flex justify-content-between mb-3">
                                <span className="mb-3">
                                    <strong>Rata-rata Transaksi</strong>
                                </span>
                            </div>
                        </div>
                        <div className="col-6 lg:col-6 xl:col-6">
                            <div className="text-900 font-medium mt-5 text-l" style={{ textAlign: "right" }}>
                                {/* {loading ? (
                                    <i className="pi pi-spinner pi-spin" style={{ fontSize: '1.5em', marginRight: '8px' }} />
                                ) : (
                                    <p>Rp.{numberWithCommas(aset)}</p>
                                )} */}
                                <p>Rp. 178.000.200</p>
                            </div>
                        </div>
                    </div>
                    <hr style={{ margin: "0" }}></hr>
                    <div style={{ fontSize: "14px" }}>
                        {/* <p>Last Updated: {lastUpdated ? `${formatDateTable(lastUpdated)}` : "-"}</p> */}
                        <p>Last Updated: -</p>
                    </div>
                </div>
                <div className="card mb-2">
                    <div className="formgrid grid">
                        <div className="col-6 lg:col-6 xl:col-6">
                            <div className="flex justify-content-between mb-3">
                                <span className="mb-3">
                                    <strong>Laba/Rugi</strong>
                                </span>
                            </div>
                        </div>
                        <div className="col-6 lg:col-6 xl:col-6">
                            <div className="text-900 font-medium mt-5 text-l" style={{ textAlign: "right" }}>
                                {/* {loading ? (
                                    <i className="pi pi-spinner pi-spin" style={{ fontSize: '1.5em', marginRight: '8px' }} />
                                ) : (
                                    <p>Rp.{numberWithCommas(aset)}</p>
                                )} */}
                                <p>Rp. 178.000.200</p>
                            </div>
                        </div>
                    </div>
                    <hr style={{ margin: "0" }}></hr>
                    <div style={{ fontSize: "14px" }}>
                        {/* <p>Last Updated: {lastUpdated ? `${formatDateTable(lastUpdated)}` : "-"}</p> */}
                        <p>Last Updated: -</p>
                    </div>
                </div>
            </div>

        </div>
    );
}

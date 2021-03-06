import React from "react";
import moment from "moment";
import { convertStatus } from "../../../lib/utils";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import useSWR from "swr";
import axios from "axios";
import { SkeletonBox } from "../Loading";
import { MokokoSeed } from "../LoadingIcons";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface props {
  id: string;
  locale: string;
  tz: string;
  className: string;
  responsive: boolean;
  maintainAspectRatio: boolean;
}

const fetcher = (id: number) => {
  return axios
    .get(`${process.env.NEXT_PUBLIC_VERCEL_URL}/api/server/id/${id}`)
    .then((res: any) => {
      const data = res.data;
      data?.serverStatus.reverse();
      data?.serverStatus?.push({
        createdAt: moment.utc(),
        status: data?.serverStatus[data.serverStatus.length - 1]?.status,
      });

      return data;
    });
};

export const ServerChart = ({
  id = "",
  locale = "en-US",
  tz = Intl.DateTimeFormat().resolvedOptions().timeZone,
  className,
  responsive = false,
  maintainAspectRatio = false,
}: props) => {
  const { data, error } = useSWR(id, fetcher);

  if (error)
    return <div>An error has occurred. Unable to load server status.</div>;
  if (!data)
    return (
      <SkeletonBox
        animatePulse={false}
        className={className}
        message={<MokokoSeed />}
        messageHeight="h-48 lg:h-96"
        messageWidth="w-48 lg:w-96"
      />
    );

  const server = data;

  const chartOptions = {
    responsive: responsive,
    maintainAspectRatio: maintainAspectRatio,
    scales: {
      y: {
        ticks: {
          callback: function (value: any) {
            return convertStatus(value);
          },
        },
      },
    },
  };

  const chartLabels = server?.serverStatus?.map((status: any) => {
    const daysAgo = moment(status.createdAt)
      .local()
      .startOf("seconds")
      .fromNow();
    const time = moment(status.createdAt).local().format("LT");
    return `${daysAgo} @ ${time}`;
  });

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: server?.name,
        data: server?.serverStatus?.map((status: any) => {
          return convertStatus(status.status);
        }),
        borderColor: "#ff0000",
        stepped: true,
      },
    ],
  };

  return (
    <div className={`bg-white rounded-2xl p-4 ${className}`}>
      <Line options={chartOptions} data={chartData} />
    </div>
  );
};

export default ServerChart;

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import styles from './DetailedStatisticsChart.module.css';

const DetailedStatisticsChart = ({ data}) => {
  const chartData = data.map(item => ({
    name: item.answer_date,
    correct: item.correct_answers,
    incorrect: item.incorrect_answers,
    percent: item.percent_correct,
    word: item.word
  }));

  return (
    <ResponsiveContainer className={styles.container}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line 
          type="monotone" 
          dataKey="correct" 
          stroke="#82ca9d" 
          name="Правильные ответы" 
          activeDot={{ r: 8 }} 
        />
        <Line 
          type="monotone" 
          dataKey="incorrect" 
          stroke="#ff6b6b" 
          name="Неправильные ответы" 
          activeDot={{ r: 8 }} 
        />
        <Line 
          type="monotone" 
          dataKey="percent" 
          stroke="#8884d8" 
          name="Процент правильных" 
          activeDot={{ r: 8 }} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default DetailedStatisticsChart;
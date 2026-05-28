"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatearDinero } from "@/lib/format";
import type { GananciaMensual, Moneda } from "@/lib/types";

export function EarningsChart({
  datos,
  moneda,
}: {
  datos: GananciaMensual[];
  moneda: Moneda;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
          <XAxis dataKey="etiqueta" stroke="#737373" fontSize={12} tickLine={false} />
          <YAxis
            stroke="#737373"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={70}
            tickFormatter={(v: number) => formatearDinero(v, moneda)}
          />
          <Tooltip
            cursor={{ fill: "#ffffff10" }}
            contentStyle={{
              background: "#0a0a0a",
              border: "1px solid #404040",
              borderRadius: 8,
              color: "#fafafa",
            }}
            formatter={(v: number) => [formatearDinero(v, moneda), "Ganancia"]}
          />
          <Bar dataKey="ganancia" fill="#fafafa" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  isSupportedCountry,
  parsePhoneNumberFromString,
} from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";
import examples from "libphonenumber-js/examples.mobile.json";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const DEFAULT_COUNTRY: CountryCode = "TR";

/** ISO 3166-1 alpha-2 code → flag emoji (regional indicator symbols). */
const flagEmoji = (country: string): string =>
  country
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));

/** Compose an E.164 string from a national number typed in the given country. */
const toE164 = (nationalNumber: string, country: CountryCode): string => {
  let digits = nationalNumber.replace(/\D/g, "");
  if (!digits) {
    return "";
  }
  // Türkiye için: Eğer kullanıcı 11 haneli ve 0 ile başlayan (0555...) girdiyse baştaki 0'ı temizle
  if (country === "TR" && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  const parsed = parsePhoneNumberFromString(digits, country);
  return parsed?.number ?? `+${getCountryCallingCode(country)}${digits}`;
};

/** Dinamik Ülke Placeholder Değeri */
const getPlaceholderForCountry = (c: CountryCode): string => {
  if (c === "TR") return "555 123 45 67";
  try {
    const ex = getExampleNumber(c, examples);
    if (ex) return ex.formatNational();
  } catch {}
  return "555 123 45 67";
};

/** Giriş yapıldıkça ulusal formata göre dinamik boşluklandırma */
const formatAsYouType = (raw: string, country: CountryCode): string => {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const ayt = new AsYouType(country);
  return ayt.input(digits);
};

type PhoneInputProps = {
  id?: string;
  onChange: (e164: string) => void;
  defaultCountry?: CountryCode;
  initialValue?: string;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
};

export function PhoneInput({
  id,
  onChange,
  defaultCountry = "TR",
  initialValue,
  invalid,
  disabled,
  className,
}: PhoneInputProps) {
  const initial = useMemo(
    () => (initialValue ? parsePhoneNumberFromString(initialValue) : undefined),
    [initialValue],
  );

  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    initial?.country ?? defaultCountry ?? DEFAULT_COUNTRY,
  );

  const [nationalNumber, setNationalNumber] = useState(() => {
    if (initial?.nationalNumber) {
      return formatAsYouType(initial.nationalNumber, initial.country ?? DEFAULT_COUNTRY);
    }
    return "";
  });

  const country = selectedCountry;
  const placeholder = useMemo(() => getPlaceholderForCountry(country), [country]);

  // Hold the latest onChange in a ref so the emit effect below doesn't refire on every parent re-render
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Emit the composed E.164 value only when country or number changes
  useEffect(() => {
    onChangeRef.current(toE164(nationalNumber, country));
  }, [country, nationalNumber]);

  const countries = useMemo(() => {
    const names = new Intl.DisplayNames(["tr", "en"], { type: "region" });
    const list = getCountries().map((code) => ({
      code,
      name: names.of(code) ?? code,
      dialCode: getCountryCallingCode(code),
      flag: flagEmoji(code),
    }));

    // Türkiye'yi en üste al, geri kalanını alfabetik sırala
    return list.sort((a, b) => {
      if (a.code === "TR") return -1;
      if (b.code === "TR") return 1;
      return a.name.localeCompare(b.name, "tr");
    });
  }, []);

  const handleCountryChange = (value: string | null) => {
    if (!value || !isSupportedCountry(value)) return;
    const newCountry = value as CountryCode;
    setSelectedCountry(newCountry);
    // Ülke değiştiğinde girilen numarayı yeni ülkenin formatına göre tekrar biçimlendir
    if (nationalNumber) {
      setNationalNumber(formatAsYouType(nationalNumber, newCountry));
    }
  };

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAsYouType(event.target.value, country);
    setNationalNumber(formatted);
  };

  return (
    <div className={cn("flex items-center gap-2 w-full", className)}>
      {/* Ülke Seçici (Untitled UI Dropdown) */}
      <Select
        value={country}
        onValueChange={handleCountryChange}
        disabled={disabled}
      >
        <SelectTrigger
          aria-label="Ülke Kodu"
          aria-invalid={invalid || undefined}
          className={cn(
            "h-11 w-[6.8rem] sm:w-[7.2rem] shrink-0 rounded-xl border border-gray-300 bg-white px-2.5 text-xs sm:text-sm font-semibold text-gray-900 shadow-xs",
            "hover:bg-gray-50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none",
            invalid && "border-rose-500 ring-2 ring-rose-500/20",
          )}
        >
          <span className="flex items-center gap-1.5 truncate">
            <span className="text-base leading-none" aria-hidden>
              {flagEmoji(country)}
            </span>
            <span className="font-bold tabular-nums">+{getCountryCallingCode(country)}</span>
          </span>
        </SelectTrigger>

        <SelectContent
          align="start"
          alignItemWithTrigger={false}
          className="max-h-72 min-w-[18rem] rounded-xl border border-gray-200 bg-white p-1 shadow-lg text-gray-900"
        >
          {countries.map((item) => (
            <SelectItem
              key={item.code}
              value={item.code}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs sm:text-sm cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <span className="text-base leading-none" aria-hidden>
                {item.flag}
              </span>
              <span className="flex-1 font-medium text-gray-900 truncate">
                {item.name}
              </span>
              <span className="text-xs font-semibold text-gray-500 tabular-nums">
                +{item.dialCode}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Telefon Numarası Input (Untitled UI Input) */}
      <div className="relative flex-1">
        <input
          id={id}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={placeholder}
          value={nationalNumber}
          onChange={handleNumberChange}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          maxLength={18}
          className={cn(
            "h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm sm:text-base font-semibold text-gray-900 shadow-xs",
            "placeholder:text-gray-400 placeholder:font-normal",
            "hover:border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all",
            invalid && "border-rose-500 ring-2 ring-rose-500/20",
            disabled && "bg-gray-50 text-gray-400 cursor-not-allowed",
          )}
        />
      </div>
    </div>
  );
}

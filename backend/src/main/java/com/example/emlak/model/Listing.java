package com.example.emlak.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Listing {
    private Long ilanNo;              // ilan_no int8 primary key
    private LocalDateTime ilanTarihi; // ilan_tarihi timestamp
    private String baslik;            // baslik text
    private String emlakTipi;         // emlak_tipi text
    private Long fiyat;               // fiyat int8
    private String detay;             // detay text
    private Integer m2;               // m2 int8
    private String il;                // il text
    private String ilce;              // ilce text
    private String mahalle;           // mahalle text
    private Long sahibindenNo;        // sahibinden_no int8
    private String sahibiAd;          // sahibi_ad text
    private String sahibiTel;         // sahibi_tel text
    private LocalDate sahibindenTarih; // sahibinden_tarih date
    private Integer ada;              // ada int8
    private Integer parsel;           // parsel int8
    private String odaSayisi;         // oda_sayisi text
    private String binaYasi;          // bina_yasi text
    private Integer bulunduguKat;     // bulundugu_kat int8
    private Integer katSayisi;        // kat_sayisi int8
    private String isitma;            // isitma text
    private Integer banyoSayisi;      // banyo_sayisi int8
    private Boolean balkon;           // balkon bool
    private Boolean asansor;          // asansor bool
    private Boolean esyali;           // esyali bool
    private Integer aidat;            // aidat int8
    private String fotolar;           // fotolar text
}


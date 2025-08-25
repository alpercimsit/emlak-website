package com.example.emlak.controller;

import com.example.emlak.config.JwtUtil;
import com.example.emlak.model.Listing;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private final List<Listing> listings = new CopyOnWriteArrayList<>();
    private final JwtUtil jwtUtil;

    @Value("${admin.username:admin}")
    private String adminUsername;

    public ListingController(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
        // Example seed data with Supabase structure
        Listing exampleListing = new Listing();
        exampleListing.setIlanNo(1L);
        exampleListing.setIlanTarihi(java.time.LocalDateTime.now());
        exampleListing.setBaslik("Merkezi Konumda 2+1 Daire");
        exampleListing.setEmlakTipi("Daire");
        exampleListing.setFiyat(1500000L);
        exampleListing.setDetay("Merkezi konumda, ulaşım kolaylığı olan, ferah 2+1 daire");
        exampleListing.setM2(95);
        exampleListing.setIl("İstanbul");
        exampleListing.setIlce("Kadıköy");
        exampleListing.setMahalle("Moda");
        exampleListing.setSahibindenNo(123456789L);
        exampleListing.setSahibiAd("Ahmet Yılmaz");
        exampleListing.setSahibiTel("0532 123 45 67");
        exampleListing.setSahibindenTarih(java.time.LocalDate.now());
        exampleListing.setAda(15);
        exampleListing.setParsel(8);
        exampleListing.setOdaSayisi("2+1");
        exampleListing.setBinaYasi("5-10 yıl");
        exampleListing.setBulunduguKat(3);
        exampleListing.setKatSayisi(7);
        exampleListing.setIsitma("Kombi");
        exampleListing.setBanyoSayisi(1);
        exampleListing.setBalkon(true);
        exampleListing.setAsansor(true);
        exampleListing.setEsyali(false);
        exampleListing.setAidat(350);
        exampleListing.setFotolar("https://picsum.photos/400,https://picsum.photos/401");
        listings.add(exampleListing);
    }

    private boolean isValidAdminToken(String authHeader) {
        try {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                String username = jwtUtil.extractUsername(token);
                return jwtUtil.isTokenValid(token) && adminUsername.equals(username);
            }
        } catch (Exception e) {
            // Token is invalid
        }
        return false;
    }

    @GetMapping
    public List<Listing> getListings(@RequestParam(required = false) Long minPrice,
                                     @RequestParam(required = false) Long maxPrice,
                                     @RequestParam(required = false) String emlakTipi,
                                     @RequestParam(required = false) String il,
                                     @RequestParam(required = false) String ilce,
                                     @RequestParam(required = false, defaultValue = "priceAsc") String sort) {
        Stream<Listing> stream = listings.stream();
        
        if (minPrice != null) {
            stream = stream.filter(l -> l.getFiyat() != null && l.getFiyat() >= minPrice);
        }
        if (maxPrice != null) {
            stream = stream.filter(l -> l.getFiyat() != null && l.getFiyat() <= maxPrice);
        }
        if (emlakTipi != null && !emlakTipi.isEmpty()) {
            stream = stream.filter(l -> l.getEmlakTipi() != null && 
                                      l.getEmlakTipi().toLowerCase().contains(emlakTipi.toLowerCase()));
        }
        if (il != null && !il.isEmpty()) {
            stream = stream.filter(l -> l.getIl() != null && 
                                      l.getIl().toLowerCase().contains(il.toLowerCase()));
        }
        if (ilce != null && !ilce.isEmpty()) {
            stream = stream.filter(l -> l.getIlce() != null && 
                                      l.getIlce().toLowerCase().contains(ilce.toLowerCase()));
        }
        
        Comparator<Listing> comparator = Comparator.comparing(Listing::getFiyat, Comparator.nullsLast(Long::compareTo));
        if ("priceDesc".equalsIgnoreCase(sort)) {
            comparator = comparator.reversed();
        } else if ("dateDesc".equalsIgnoreCase(sort)) {
            comparator = Comparator.comparing(Listing::getIlanTarihi, Comparator.nullsLast(java.time.LocalDateTime::compareTo)).reversed();
        } else if ("dateAsc".equalsIgnoreCase(sort)) {
            comparator = Comparator.comparing(Listing::getIlanTarihi, Comparator.nullsLast(java.time.LocalDateTime::compareTo));
        }
        
        return stream.sorted(comparator).toList();
    }

    @PostMapping
    public ResponseEntity<Listing> addListing(@RequestBody Listing listing,
                                              @RequestHeader("Authorization") String authHeader) {
        if (!isValidAdminToken(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        long nextId = listings.stream().mapToLong(Listing::getIlanNo).max().orElse(0L) + 1;
        listing.setIlanNo(nextId);
        if (listing.getIlanTarihi() == null) {
            listing.setIlanTarihi(java.time.LocalDateTime.now());
        }
        listings.add(listing);
        return ResponseEntity.ok(listing);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteListing(@PathVariable Long id,
                                              @RequestHeader("Authorization") String authHeader) {
        if (!isValidAdminToken(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        boolean removed = listings.removeIf(l -> Objects.equals(l.getIlanNo(), id));
        return removed ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}


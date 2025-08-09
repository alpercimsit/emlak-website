package com.example.emlak.controller;

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
    private final String adminToken;

    public ListingController(@Value("${admin.token:changeme}") String adminToken) {
        this.adminToken = adminToken;
        // Example seed data
        listings.add(new Listing(1L, "Örnek Daire", "Merkezi konumda 2+1", 1500000.0, 2, 41.015137, 28.979530, "https://picsum.photos/400"));
    }

    @GetMapping
    public List<Listing> getListings(@RequestParam(required = false) Double minPrice,
                                     @RequestParam(required = false) Double maxPrice,
                                     @RequestParam(required = false, defaultValue = "priceAsc") String sort) {
        Stream<Listing> stream = listings.stream();
        if (minPrice != null) {
            stream = stream.filter(l -> l.getPrice() != null && l.getPrice() >= minPrice);
        }
        if (maxPrice != null) {
            stream = stream.filter(l -> l.getPrice() != null && l.getPrice() <= maxPrice);
        }
        Comparator<Listing> comparator = Comparator.comparing(Listing::getPrice, Comparator.nullsLast(Double::compareTo));
        if ("priceDesc".equalsIgnoreCase(sort)) {
            comparator = comparator.reversed();
        }
        return stream.sorted(comparator).toList();
    }

    @PostMapping
    public ResponseEntity<Listing> addListing(@RequestBody Listing listing,
                                              @RequestHeader("X-ADMIN-TOKEN") String token) {
        if (!Objects.equals(token, adminToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        long nextId = listings.stream().mapToLong(Listing::getId).max().orElse(0L) + 1;
        listing.setId(nextId);
        listings.add(listing);
        return ResponseEntity.ok(listing);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteListing(@PathVariable Long id,
                                              @RequestHeader("X-ADMIN-TOKEN") String token) {
        if (!Objects.equals(token, adminToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        boolean removed = listings.removeIf(l -> Objects.equals(l.getId(), id));
        return removed ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}


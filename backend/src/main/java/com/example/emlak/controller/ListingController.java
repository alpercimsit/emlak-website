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
        // Example seed data
        listings.add(new Listing(1L, "Örnek Daire", "Merkezi konumda 2+1", 1500000.0, 2, 41.015137, 28.979530, "https://picsum.photos/400"));
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
                                              @RequestHeader("Authorization") String authHeader) {
        if (!isValidAdminToken(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        long nextId = listings.stream().mapToLong(Listing::getId).max().orElse(0L) + 1;
        listing.setId(nextId);
        listings.add(listing);
        return ResponseEntity.ok(listing);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteListing(@PathVariable Long id,
                                              @RequestHeader("Authorization") String authHeader) {
        if (!isValidAdminToken(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        boolean removed = listings.removeIf(l -> Objects.equals(l.getId(), id));
        return removed ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}


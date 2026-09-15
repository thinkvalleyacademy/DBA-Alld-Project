package com.dba.alld.service;

import com.dba.alld.dto.GenericApiResponse;


public interface VoterService {

    GenericApiResponse<Object> listGMMember(int page, int size);

    GenericApiResponse<Object> listGmVotersByMonthYear(int year, int month, int page, int size);

    GenericApiResponse<Object> listLmVotersByMonthYear(int year, int month, int page, int size);

    GenericApiResponse<Object> searchGmVotersByMonthYear(int year, int month, String searchQuery, int page, int size);

    GenericApiResponse<Object> searchLmVoters(String searchQuery, int page, int size);

    GenericApiResponse<Object> searchLmVotersByMonthYear(int year, int month, String searchQuery, int page, int size);

}

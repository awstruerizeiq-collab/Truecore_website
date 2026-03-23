package com.hireconnect.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssetStatsResponse {

    private long totalAssets;
    private long laptops;
    private long mobiles;
    private long tablets;
    private long simCards;
    private long others;
	public long getTotalAssets() {
		return totalAssets;
	}
	public void setTotalAssets(long totalAssets) {
		this.totalAssets = totalAssets;
	}
	public long getLaptops() {
		return laptops;
	}
	public void setLaptops(long laptops) {
		this.laptops = laptops;
	}
	public long getMobiles() {
		return mobiles;
	}
	public void setMobiles(long mobiles) {
		this.mobiles = mobiles;
	}
	public long getTablets() {
		return tablets;
	}
	public void setTablets(long tablets) {
		this.tablets = tablets;
	}
	public long getSimCards() {
		return simCards;
	}
	public void setSimCards(long simCards) {
		this.simCards = simCards;
	}
	public long getOthers() {
		return others;
	}
	public void setOthers(long others) {
		this.others = others;
	}
    
}